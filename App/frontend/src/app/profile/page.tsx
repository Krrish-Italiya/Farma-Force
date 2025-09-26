"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import userImg from "@/assets/user img.jpg";

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  profileImage?: string;
}

interface KPIThreshold {
  name: string;
  value: string;
  progress: number;
}

interface NotificationSetting {
  name: string;
  enabled: boolean;
}

// ✅ define backend API base URL once
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingKPI, setIsSavingKPI] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteFinal, setShowDeleteFinal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [savingNotificationIndex, setSavingNotificationIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    profileImage: "",
  });

  const [kpiThresholds, setKpiThresholds] = useState<KPIThreshold[]>([
    { name: "Call Rate Target", value: "90", progress: 90 },
    { name: "Customer Coverage", value: "75%", progress: 75 },
    { name: "Frequency Of Visits", value: "15 Visits", progress: 50 },
  ]);

  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { name: "KPI Alerts", enabled: false },
    { name: "Email Alerts", enabled: false },
    { name: "AI Recommendation", enabled: false },
  ]);



  const [isEditingKPI, setIsEditingKPI] = useState(false);

  // Load user data from database
  const loadUserData = async () => {
    try {
      console.log("Loading user data from database...");
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("User data loaded from DB:", userData);
        
        // Update profile data
        setProfileData({
          fullName: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          location: userData.location || "",
          profileImage: userData.profileImage || "",
        });

        // Update KPI thresholds from database
        if (userData.kpiThresholds) {
          setKpiThresholds([
            { 
              name: "Call Rate Target", 
              value: userData.kpiThresholds.callRateTarget?.toString() || "90", 
              progress: userData.kpiThresholds.callRateTarget || 90 
            },
            { 
              name: "Customer Coverage", 
              value: `${userData.kpiThresholds.customerCoverage || 75}%`, 
              progress: userData.kpiThresholds.customerCoverage || 75 
            },
            { 
              name: "Frequency Of Visits", 
              value: `${userData.kpiThresholds.frequencyOfVisits || 15} Visits`, 
              progress: Math.min((userData.kpiThresholds.frequencyOfVisits || 15) * 3.33, 100) 
            },
          ]);
        }

        // Update notifications from database
        if (userData.notifications) {
          console.log("Setting notifications from DB:", userData.notifications);
          setNotifications([
            { name: "KPI Alerts", enabled: userData.notifications.kpiAlerts === true },
            { name: "Email Alerts", enabled: userData.notifications.emailAlerts === true },
            { name: "AI Recommendation", enabled: userData.notifications.aiRecommendation === true },
          ]);
        } else {
          console.log("No notifications data in DB, using defaults");
        }
      } else {
        console.log("API call failed, using AuthContext data");
        // Fallback: try to load from AuthContext user data
        if (user?.notifications) {
          setNotifications([
            { name: "KPI Alerts", enabled: user.notifications.kpiAlerts === true },
            { name: "Email Alerts", enabled: user.notifications.emailAlerts === true },
            { name: "AI Recommendation", enabled: user.notifications.aiRecommendation === true },
          ]);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize profile data from AuthContext and database
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        profileImage: user.profileImage || "",
      });
      loadUserData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Also load fresh data when component mounts/focuses
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, []); // Empty dependency array means it runs once when component mounts

  // Refresh data when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Update profile image in database
        const updateResponse = await fetch(`${API_BASE}/api/user/update-profile-image`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            profileImage: data.url,
          }),
        });

        if (updateResponse.ok) {
          const updatedUser = {
            ...user,
            profileImage: data.url,
            name: user?.name || "John Doe",
            email: user?.email || "john.doe@farmaforce.com",
          } as User;
          updateUser(updatedUser);
          setProfileData((prev) => ({
            ...prev,
            profileImage: data.url,
          }));
          alert("Profile image updated successfully!");
        } else {
          const errorText = await updateResponse.text();
          console.error("Update profile image error:", updateResponse.status, errorText);
          alert(`Failed to update profile image. Status: ${updateResponse.status}`);
        }
      } else {
        console.error("Upload failed:", data);
        alert(`Failed to upload image: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      // Exclude email from the update data since it should not be changeable
      const { email, ...updateData } = profileData;
      const response = await fetch(`${API_BASE}/api/user/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = {
          ...user,
          name: profileData.fullName,
          email: user?.email, // Keep the original email from user context
          phone: profileData.phone,
          location: profileData.location,
        } as User;
        updateUser(updatedUser);
        setIsEditing(false);
        alert("Profile updated successfully!");
      } else {
        const errorText = await response.text();
        console.error("Update profile error:", response.status, errorText);
        alert(`Failed to update profile. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleSaveKPIThresholds = async () => {
    setIsSavingKPI(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/user/update-kpi-thresholds`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          callRateTarget: parseInt(kpiThresholds[0].value),
          customerCoverage: parseInt(kpiThresholds[1].value.replace('%', '')),
          frequencyOfVisits: parseInt(kpiThresholds[2].value.replace(' Visits', '')),
        }),
      });

      if (response.ok) {
        alert("KPI thresholds updated successfully!");
        setIsEditingKPI(false);
      } else {
        const errorText = await response.text();
        console.error("Update KPI thresholds error:", response.status, errorText);
        alert(`Failed to update KPI thresholds. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating KPI thresholds:", error);
      alert("Error updating KPI thresholds. Please try again.");
    } finally {
      setIsSavingKPI(false);
    }
  };



  const handleNotificationToggle = async (index: number) => {
    const updatedNotifications = notifications.map((notification, i) =>
      i === index ? { ...notification, enabled: !notification.enabled } : notification
    );
    
    setNotifications(updatedNotifications);
    setSavingNotificationIndex(index);

    // Auto-save notification settings
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/user/update-notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          kpiAlerts: updatedNotifications[0].enabled,
          emailAlerts: updatedNotifications[1].enabled,
          aiRecommendation: updatedNotifications[2].enabled,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update notifications error:", response.status, errorText);
        // Revert the change if save failed
        setNotifications(notifications);
        alert(`Failed to update notification settings. Status: ${response.status}`);
      } else {
        // Successfully saved, refresh data from database to ensure consistency
        loadUserData();
      }
    } catch (error) {
      console.error("Error updating notifications:", error);
      // Revert the change if save failed
      setNotifications(notifications);
      alert("Error updating notification settings. Please try again.");
    } finally {
      setSavingNotificationIndex(null);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    setShowDeleteFinal(true);
  };

  const handleFinalDelete = async () => {
    setIsDeletingAccount(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/user/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setShowDeleteFinal(false);
        alert("Your account has been deleted successfully.");
        logout();
      } else {
        const errorText = await response.text();
        console.error("Delete account error:", response.status, errorText);
        alert(`Failed to delete account. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Error deleting account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 font-inter">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Header */}
        <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
          <button 
            className="p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-gray-800">Profile</h1>

          <div className="flex items-center space-x-2">
          
            <button 
              className="p-1"
              onClick={() => router.push('/dashboard')}
            >
                          <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading profile...</span>
            </div>
          ) : (
            <>
              {/* Profile Summary */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white shadow-lg mx-auto mb-3">
                    <Image
                      src={profileData.profileImage || userImg}
                      alt="Profile"
                      width={80}
                      height={80}
                      priority
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {profileData.fullName}
                </h2>
                <p className="text-sm text-gray-500">
                  {user?.employeeId ? `Employee ID: ${user.employeeId}` : "Sales Representative"}
                </p>
              </div>

              {/* Personal Details */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Employee ID</span>
                    <span className="text-sm font-medium text-gray-900">{user?.employeeId || "N/A"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Full Name</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="text-sm font-medium text-gray-900 text-right bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[150px]"
                        placeholder="Enter full name"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{profileData.fullName}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="text-sm font-medium text-gray-900">{profileData.email}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Phone</span>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="text-sm font-medium text-gray-900 text-right bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[140px]"
                        placeholder="Enter phone"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{profileData.phone}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Location</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter location"
                        className="text-sm font-medium text-gray-900 text-right bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[150px]"
                      />
                    ) : (
                      <div 
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
                        onClick={() => !profileData.location && setIsEditing(true)}
                      >
                        {profileData.location || (
                          <span className="text-gray-400 italic hover:text-purple-500">
                            Click to add location
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  {isEditing ? (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 bg-purple-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEditClick}
                      className="w-full border-2 border-[rgba(73,28,124,0.88)] text-[rgba(73,28,124,0.88)] py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* KPI Thresholds */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">KPI Thresholds</h3>
                <div className="space-y-5">
                  {kpiThresholds.map((kpi, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{kpi.name}</span>
                        {isEditingKPI ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={kpi.name === "Customer Coverage" ? kpi.value.replace('%', '') : kpi.name === "Frequency Of Visits" ? kpi.value.replace(' Visits', '') : kpi.value}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                const newKpiThresholds = [...kpiThresholds];
                                if (kpi.name === "Customer Coverage") {
                                  newKpiThresholds[index] = { ...kpi, value: `${newValue}%`, progress: parseInt(newValue) || 0 };
                                } else if (kpi.name === "Frequency Of Visits") {
                                  newKpiThresholds[index] = { ...kpi, value: `${newValue} Visits`, progress: Math.min(parseInt(newValue) * 3.33, 100) };
                                } else {
                                  newKpiThresholds[index] = { ...kpi, value: newValue, progress: parseInt(newValue) || 0 };
                                }
                                setKpiThresholds(newKpiThresholds);
                              }}
                              className="w-16 text-sm font-medium text-gray-900 text-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              min="0"
                              max={kpi.name === "Customer Coverage" ? "100" : "1000"}
                            />
                            <span className="text-sm text-gray-500">
                              {kpi.name === "Customer Coverage" ? "%" : kpi.name === "Frequency Of Visits" ? "Visits" : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">{kpi.value}</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[rgba(73,28,124,0.88)] h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${Math.min(kpi.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  {isEditingKPI ? (
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setIsEditingKPI(false)}
                        className="flex-1 border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveKPIThresholds}
                        disabled={isSavingKPI}
                        className="flex-1 bg-purple-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isSavingKPI ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditingKPI(true)}
                      className="w-full border-2 border-[rgba(73,28,124,0.88)] text-[rgba(73,28,124,0.88)] py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
                    >
                      Set Targets
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Notifications</h3>
                                 <div className="space-y-4">
                   {notifications.map((notification, index) => (
                     <div key={index} className="flex justify-between items-center py-1">
                       <span className="text-sm text-gray-900 font-medium">{notification.name}</span>
                       <button
                         onClick={() => handleNotificationToggle(index)}
                         disabled={savingNotificationIndex === index}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                           notification.enabled ? 'bg-green-500' : 'bg-gray-300'
                         }`}
                       >
                         {savingNotificationIndex === index ? (
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-1" />
                         ) : (
                           <span
                             className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                               notification.enabled ? 'translate-x-6' : 'translate-x-1'
                             }`}
                           />
                         )}
                       </button>
                     </div>
                   ))}
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={logout}
                  className="w-full bg-[rgba(73,28,124,0.88)] text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Log Out
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="w-full bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data including:
            </p>
            <ul className="text-sm text-gray-600 mb-6 space-y-1 bg-gray-50 rounded-lg p-3">
              <li>• Your profile information</li>
              <li>• KPI thresholds and settings</li>
              <li>• Notification preferences</li>
              <li>• All login and signup data</li>
            </ul>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Delete Confirmation Modal */}
      {showDeleteFinal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Final Confirmation</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Your account will be permanently deleted. Press OK to confirm the deletion.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteFinal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                onClick={handleFinalDelete}
                disabled={isDeletingAccount}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium"
              >
                {isDeletingAccount ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  "OK"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}