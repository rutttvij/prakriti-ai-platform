from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.route import Route
from app.models.route_stop import RouteStop
from app.schemas.route_stop import RouteStopCreate
from app.services.operations_common import resolve_source_entity


def create_route_stop(db: Session, payload: RouteStopCreate, actor_id: UUID | None = None) -> RouteStop:
    route = db.get(Route, payload.route_id)
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")

    source = resolve_source_entity(db, payload.source_type, payload.household_id, payload.bulk_generator_id)
    if source.city_id != route.city_id or source.ward_id != route.ward_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source not compatible with route geography")
    if route.zone_id and source.zone_id and source.zone_id != route.zone_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source zone not compatible with route")

    stop = RouteStop(**payload.model_dump())
    if actor_id:
        stop.created_by = actor_id
        stop.updated_by = actor_id

    db.add(stop)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate stop sequence or source already exists in route") from exc

    db.refresh(stop)
    return stop


def list_route_stops(
    db: Session,
    route_id: UUID | None = None,
    source_type=None,
) -> list[RouteStop]:
    query: Select[tuple[RouteStop]] = select(RouteStop).order_by(RouteStop.route_id, RouteStop.stop_sequence)
    if route_id:
        query = query.where(RouteStop.route_id == route_id)
    if source_type:
        query = query.where(RouteStop.source_type == source_type)
    return list(db.scalars(query).all())


def get_route_stop(db: Session, route_stop_id: UUID) -> RouteStop:
    stop = db.get(RouteStop, route_stop_id)
    if not stop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route stop not found")
    return stop
