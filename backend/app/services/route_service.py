from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.route import Route
from app.schemas.route import RouteCreate
from app.services.operations_common import validate_city_ward_zone


def create_route(db: Session, payload: RouteCreate, actor_id: UUID | None = None) -> Route:
    existing = db.scalar(select(Route).where(Route.route_code == payload.route_code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Route code already exists")

    validate_city_ward_zone(db, payload.city_id, payload.ward_id, payload.zone_id)

    route = Route(**payload.model_dump())
    if actor_id:
        route.created_by = actor_id
        route.updated_by = actor_id

    db.add(route)
    db.commit()
    db.refresh(route)
    return route


def list_routes(
    db: Session,
    city_id: UUID | None = None,
    ward_id: UUID | None = None,
    zone_id: UUID | None = None,
    route_type=None,
) -> list[Route]:
    query: Select[tuple[Route]] = select(Route).order_by(Route.created_at.desc())
    if city_id:
        query = query.where(Route.city_id == city_id)
    if ward_id:
        query = query.where(Route.ward_id == ward_id)
    if zone_id:
        query = query.where(Route.zone_id == zone_id)
    if route_type:
        query = query.where(Route.route_type == route_type)
    return list(db.scalars(query).all())


def get_route(db: Session, route_id: UUID) -> Route:
    route = db.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return route
