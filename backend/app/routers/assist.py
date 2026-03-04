from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.ai_service import generate_description_and_tags

router = APIRouter(prefix="/assist", tags=["assist"])


class AssistRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    resource_type: str = Field(min_length=3, max_length=20)


class AssistResponse(BaseModel):
    description: str
    tags: list[str]


@router.post("", response_model=AssistResponse)
def smart_assist(payload: AssistRequest) -> AssistResponse:
    description, tags = generate_description_and_tags(
        payload.title, payload.resource_type
    )
    return AssistResponse(description=description, tags=tags)
