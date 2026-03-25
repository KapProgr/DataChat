from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import httpx
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

router = APIRouter()

def get_supabase_headers():
    """Get headers for Supabase REST API"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    return {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def get_supabase_url():
    """Get Supabase REST API base URL"""
    base_url = os.getenv("SUPABASE_URL")
    if not base_url:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return f"{base_url}/rest/v1"


class UserSyncRequest(BaseModel):
    clerk_id: str
    email: str
    name: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    clerk_user_id: str
    email: str
    name: Optional[str]
    created_at: str
    updated_at: str


@router.post("/sync", response_model=UserResponse)
async def sync_user(request: UserSyncRequest):
    """
    Sync user from Clerk to Supabase database.
    Uses Supabase REST API to avoid connection issues.
    """
    base_url = get_supabase_url()
    headers = get_supabase_headers()
    
    try:
        async with httpx.AsyncClient() as client:
            # First try to get existing user
            get_response = await client.get(
                f"{base_url}/users",
                headers=headers,
                params={"clerk_user_id": f"eq.{request.clerk_id}"}
            )
            
            user_data = {
                "clerk_user_id": request.clerk_id,
                "email": request.email,
                "name": request.name
            }
            
            if get_response.status_code == 200 and get_response.json():
                # User exists, update it
                response = await client.patch(
                    f"{base_url}/users",
                    headers=headers,
                    params={"clerk_user_id": f"eq.{request.clerk_id}"},
                    json=user_data
                )
            else:
                # User doesn't exist, create it
                response = await client.post(
                    f"{base_url}/users",
                    headers=headers,
                    json=user_data
                )
            
            if response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Supabase error: {response.text}"
                )
            
            users = response.json()
            if not users or len(users) == 0:
                raise HTTPException(status_code=500, detail="Failed to sync user")
            
            return users[0]
        
    except httpx.HTTPError as e:
        print(f"HTTP Error syncing user: {e}")
        raise HTTPException(status_code=500, detail=f"Error syncing user: {str(e)}")
    except Exception as e:
        print(f"Error syncing user: {e}")
        raise HTTPException(status_code=500, detail=f"Error syncing user: {str(e)}")


@router.get("/{clerk_id}", response_model=UserResponse)
async def get_user(clerk_id: str):
    """
    Get user by Clerk ID.
    """
    base_url = get_supabase_url()
    headers = get_supabase_headers()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/users",
                headers=headers,
                params={"clerk_user_id": f"eq.{clerk_id}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Supabase error: {response.text}"
                )
            
            users = response.json()
            if not users or len(users) == 0:
                raise HTTPException(status_code=404, detail="User not found")
            
            return users[0]
        
    except httpx.HTTPError as e:
        print(f"HTTP Error getting user: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting user: {str(e)}")
    except Exception as e:
        print(f"Error getting user: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting user: {str(e)}")
