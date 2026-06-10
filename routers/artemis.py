import httpx
import math
import time
import random
from fastapi import APIRouter, Request

ARTEMIS_BASE_URL = "http://progetti.smarteducationlab.it:10011"

router = APIRouter(prefix="/artemis", tags=["ARTEMIS"])

# =====================================================
# SIMULAZIONE MANUALE
# =====================================================

USE_MANUAL_VALUES = True

SIMULATED_VALUES = {
    2: {
        "temperature": 18,
        "humidity": 65,
        "co2": 450,
    },
}

# =====================================================


def simulate_value(sensor_type: str, node_id: int) -> dict:

    if USE_MANUAL_VALUES:
        manual_value = SIMULATED_VALUES.get(node_id, {}).get(sensor_type)

        if manual_value is not None:
            units = {
                "temperature": "C",
                "humidity": "pct",
                "co2": "ppm",
                "light": "lx",
                "pressure": "hPa",
                "voc": "ppb",
            }

            return {
                "value": manual_value,
                "unit": units.get(sensor_type, "")
            }

    # -------------------------------------------------
    # Simulazione automatica attuale
    # -------------------------------------------------

    t = time.time()
    seed = node_id * 100 + hash(sensor_type) % 100

    if sensor_type == 'temperature':
        base = 22.0
        variation = 2.0 * math.sin(t / 3600 + seed) + random.uniform(-0.3, 0.3)
        return {"value": round(base + variation, 2), "unit": "C"}

    elif sensor_type == 'humidity':
        base = 55.0
        variation = 8.0 * math.sin(t / 7200 + seed) + random.uniform(-1, 1)
        return {"value": round(base + variation, 2), "unit": "pct"}

    elif sensor_type == 'co2':
        hour = (t % 86400) / 3600
        base = 500 + 150 * math.sin(math.pi * hour / 12)
        return {"value": round(base + random.uniform(-20, 20), 1), "unit": "ppm"}

    elif sensor_type == 'light':
        hour = (t % 86400) / 3600
        base = 150 + 100 * math.sin(math.pi * (hour - 9) / 9) if 9 <= hour <= 18 else 10
        return {"value": round(max(0, base + random.uniform(-10, 10)), 1), "unit": "lx"}

    elif sensor_type == 'pressure':
        base = 1013.0
        variation = 2.0 * math.sin(t / 86400 + seed) + random.uniform(-0.5, 0.5)
        return {"value": round(base + variation, 1), "unit": "hPa"}

    elif sensor_type == 'voc':
        base = 150.0
        variation = 50.0 * math.sin(t / 3600 + seed) + random.uniform(-10, 10)
        return {"value": round(max(0, base + variation), 1), "unit": "ppb"}

    return {"value": 0.0, "unit": ""}
@router.get("/nodes")
async def get_artemis_nodes():
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{ARTEMIS_BASE_URL}/nodes")
        return res.json()


@router.get("/nodes/{node_id}/data")
async def get_node_data(node_id: str, request: Request):
    params = dict(request.query_params)

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{ARTEMIS_BASE_URL}/nodes/{node_id}/data",
            params=params
        )
        return res.json()


@router.get("/nodes/{node_id}")
async def get_artemis_node(node_id: str):
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{ARTEMIS_BASE_URL}/nodes/{node_id}")
        return res.json()


@router.get("/simulate/{ioct_node_id}/data")
async def simulate_node_data_endpoint(ioct_node_id: int):
    from database import SessionLocal
    import db_models

    db = SessionLocal()

    try:
        sensors = db.query(db_models.Sensor).filter(
            db_models.Sensor.ioct_node_id == ioct_node_id
        ).all()

        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        data = []

        for s in sensors:
            if not s.sensor_type:
                continue

            simulated = simulate_value(s.sensor_type, ioct_node_id)

            data.append({
                "sensorId": s.sensor_type,
                "nodeId": f"local-{ioct_node_id}",
                "type": "scalar",
                "payload": {
                    "value": simulated["value"],
                    "unit": simulated["unit"],
                    "sensorId": s.sensor_type,
                    "timestamp": timestamp,
                },
                "receivedAt": timestamp,
            })

        return {"data": data}

    finally:
        db.close()