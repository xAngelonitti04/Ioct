import httpx
from fastapi import APIRouter, Request

ARTEMIS_BASE_URL = "http://progetti.smarteducationlab.it:10011"

router = APIRouter(prefix="/artemis", tags=["ARTEMIS"])

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