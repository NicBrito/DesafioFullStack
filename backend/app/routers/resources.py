from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Resource
from app.schemas import PaginatedResourceOut, ResourceCreate, ResourceOut, ResourceUpdate


router = APIRouter(prefix="/resources", tags=["resources"])


def to_out(resource: Resource) -> ResourceOut:
    tags = [tag.strip() for tag in resource.tags.split(",") if tag.strip()]
    return ResourceOut(
        id=resource.id,
        title=resource.title,
        description=resource.description,
        resource_type=resource.resource_type,
        url=resource.url,
        tags=tags,
    )


@router.get("", response_model=PaginatedResourceOut)
def list_resources(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> PaginatedResourceOut:
    offset = (page - 1) * page_size
    total = db.scalar(select(func.count()).select_from(Resource)) or 0
    resources = db.scalars(select(Resource).offset(offset).limit(page_size)).all()
    return PaginatedResourceOut(
        items=[to_out(resource) for resource in resources],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{resource_id}", response_model=ResourceOut)
def get_resource(resource_id: int, db: Session = Depends(get_db)) -> ResourceOut:
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return to_out(resource)


@router.post("", response_model=ResourceOut, status_code=status.HTTP_201_CREATED)
def create_resource(payload: ResourceCreate, db: Session = Depends(get_db)) -> ResourceOut:
    resource = Resource(
        title=payload.title,
        description=payload.description,
        resource_type=payload.resource_type.value,
        url=str(payload.url),
        tags=",".join(payload.tags),
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return to_out(resource)


@router.put("/{resource_id}", response_model=ResourceOut)
def update_resource(resource_id: int, payload: ResourceUpdate, db: Session = Depends(get_db)) -> ResourceOut:
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    resource.title = payload.title
    resource.description = payload.description
    resource.resource_type = payload.resource_type.value
    resource.url = str(payload.url)
    resource.tags = ",".join(payload.tags)

    db.add(resource)
    db.commit()
    db.refresh(resource)
    return to_out(resource)


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(resource_id: int, db: Session = Depends(get_db)) -> None:
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    db.delete(resource)
    db.commit()
