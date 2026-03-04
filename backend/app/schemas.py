from enum import Enum

from pydantic import BaseModel, Field, HttpUrl


class ResourceType(str, Enum):
    VIDEO = "Video"
    PDF = "PDF"
    LINK = "Link"


class ResourceBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=3)
    resource_type: ResourceType
    url: HttpUrl
    tags: list[str] = Field(default_factory=list, max_length=10)


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(ResourceBase):
    pass


class ResourceOut(ResourceBase):
    id: int


class PaginatedResourceOut(BaseModel):
    items: list[ResourceOut]
    total: int
    page: int
    page_size: int
