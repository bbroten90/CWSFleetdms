# backend/App/Api/endpoints/user_settings.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime
import logging
from pydantic import BaseModel, EmailStr, validator

from App import models
from App import schemas
from App.database_module import get_db
from auth import get_current_active_user, get_password_hash, check_manager

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/user-settings",
    tags=["user-settings"],
    dependencies=[Depends(get_current_active_user)],
)

# Schema for updating basic user profile
class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

# Schema for updating user preferences
class UserPreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    dashboard_layout: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    email_notifications_enabled: Optional[bool] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

# Schema for updating user password
class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

# Get current user profile
@router.get("/profile", response_model=schemas.User, summary="Get current user profile")
async def get_profile(
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get current user profile information.
    """
    return current_user

# Update user profile
@router.put("/profile", response_model=schemas.User, summary="Update user profile")
async def update_profile(
    profile_update: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Update current user profile information.
    """
    # Get current user from database to ensure we have latest data
    db_user = db.query(models.User).filter(models.User.user_id == current_user.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is being updated and if it already exists
    if profile_update.email and profile_update.email != db_user.email:
        existing_email = db.query(models.User).filter(
            and_(
                models.User.email == profile_update.email,
                models.User.user_id != current_user.user_id
            )
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Update user profile
    update_data = profile_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db_user.updated_at = datetime.utcnow()
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="USER_PROFILE",
        entity_id=current_user.user_id,
        details="Updated user profile"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(db_user)
    
    return db_user

# Get user preferences
@router.get("/preferences", summary="Get user preferences")
async def get_preferences(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get current user preferences.
    """
    # Check if user has preferences
    preferences = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == current_user.user_id
    ).first()
    
    # If no preferences exist, return default settings
    if not preferences:
        return {
            "theme": "light",
            "dashboard_layout": "default",
            "notifications_enabled": True,
            "email_notifications_enabled": True
        }
    
    return {
        "theme": preferences.theme,
        "dashboard_layout": preferences.dashboard_layout,
        "notifications_enabled": preferences.notifications_enabled,
        "email_notifications_enabled": preferences.email_notifications_enabled
    }

# Update user preferences
@router.put("/preferences", summary="Update user preferences")
async def update_preferences(
    preferences_update: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Update current user preferences.
    """
    # Check if user already has preferences
    preferences = db.query(models.UserPreferences).filter(
        models.UserPreferences.user_id == current_user.user_id
    ).first()
    
    update_data = preferences_update.dict(exclude_unset=True)
    
    if preferences:
        # Update existing preferences
        for key, value in update_data.items():
            setattr(preferences, key, value)
        preferences.updated_at = datetime.utcnow()
    else:
        # Create new preferences
        preferences = models.UserPreferences(
            user_id=current_user.user_id,
            **update_data
        )
        db.add(preferences)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="USER_PREFERENCES",
        entity_id=current_user.user_id,
        details="Updated user preferences"
    )
    db.add(activity_log)
    
    db.commit()
    
    if preferences:
        db.refresh(preferences)
    
    return {
        "theme": preferences.theme,
        "dashboard_layout": preferences.dashboard_layout,
        "notifications_enabled": preferences.notifications_enabled,
        "email_notifications_enabled": preferences.email_notifications_enabled
    }

# Change user password
@router.put("/change-password", summary="Change user password")
async def change_password(
    password_update: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Change current user password.
    """
    # Get current user from database
    db_user = db.query(models.User).filter(models.User.user_id == current_user.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    from auth import verify_password
    if not verify_password(password_update.current_password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    db_user.password_hash = get_password_hash(password_update.new_password)
    db_user.updated_at = datetime.utcnow()
    
    # Log activity (don't include the actual password in the log!)
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="USER_PASSWORD",
        entity_id=current_user.user_id,
        details="Changed user password"
    )
    db.add(activity_log)
    
    db.commit()
    
    return {"message": "Password updated successfully"}

# Get user activity logs
@router.get("/activity", summary="Get user activity logs")
async def get_activity_logs(
    limit: int = 20,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get activity logs for the current user.
    """
    logs = db.query(models.ActivityLog).filter(
        models.ActivityLog.user_id == current_user.user_id
    ).order_by(
        models.ActivityLog.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return logs
