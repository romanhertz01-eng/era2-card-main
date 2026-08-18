from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlmodel import Session, select

from app.database import get_session
from app.deps import get_current_user
from app.models import Generation, Project, User

router = APIRouter()

VALID_STATUSES = {"active", "draft", "archived"}


class ProjectBody(BaseModel):
    name: str
    category: str
    marketplace: Optional[str] = "wb"


class ProjectPatch(BaseModel):
    status: Optional[str] = None


@router.get("/projects")
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    projects = db.exec(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
    ).all()

    if not projects:
        return []

    project_ids = [p.id for p in projects]

    counts = db.exec(
        select(
            Generation.project_id,
            func.count(Generation.id).filter(Generation.task.in_(["photo", "card"])).label("cards"),
            func.count(Generation.id).filter(Generation.task == "video").label("videos"),
        )
        .where(Generation.project_id.in_(project_ids))
        .group_by(Generation.project_id)
    ).all()

    count_map = {r[0]: (r[1], r[2]) for r in counts}

    result = []
    for p in projects:
        cards, videos = count_map.get(p.id, (0, 0))
        d = p.model_dump()
        d["cards_count"] = cards
        d["videos_count"] = videos
        result.append(d)

    return result


@router.post("/projects", status_code=201)
def create_project(
    body: ProjectBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    project = Project(
        user_id=current_user.id,
        name=body.name,
        category=body.category,
        marketplace=body.marketplace or "wb",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.patch("/projects/{project_id}")
def update_project(
    project_id: str,
    body: ProjectPatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    project = db.exec(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    ).first()
    if not project:
        raise HTTPException(404, "Not found")
    if body.status is not None:
        if body.status not in VALID_STATUSES:
            raise HTTPException(400, f"Status must be one of {VALID_STATUSES}")
        project.status = body.status
    project.updated_at = datetime.utcnow()
    db.add(project)
    db.commit()
    db.refresh(project)
    d = project.model_dump()
    d["cards_count"] = 0
    d["videos_count"] = 0
    return d


@router.get("/projects/{project_id}/generations")
def list_project_generations(
    project_id: str,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    project = db.exec(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    ).first()
    if not project:
        raise HTTPException(404, "Not found")

    roots = db.exec(
        select(Generation)
        .where(
            Generation.project_id == project_id,
            Generation.status == "completed",
            Generation.output_url.is_not(None),
            Generation.parent_id == None,  # noqa: E711
        )
        .order_by(Generation.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    if not roots:
        return []

    def collect_descendants(parent_ids: list) -> list:
        if not parent_ids:
            return []
        children = db.exec(
            select(Generation)
            .where(Generation.parent_id.in_(parent_ids))
            .order_by(Generation.created_at.asc())
        ).all()
        if not children:
            return []
        return list(children) + collect_descendants([c.id for c in children])

    descendants = collect_descendants([r.id for r in roots])
    return list(roots) + descendants


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    project = db.exec(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    ).first()
    if not project:
        raise HTTPException(404, "Not found")
    db.delete(project)
    db.commit()
