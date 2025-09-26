"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import blueLogo from "@/assets/blue logo.png";
import bellIcon from "@/assets/Bell Icon.svg";
import messageIcon from "@/assets/Message Icon.svg";
import Sidebar from "@/components/Sidebar";
import clockIcon from "@/assets/Clock icon.svg";
import TimePin from "@/assets/Timepin Icon.svg";

// Using Leaflet directly to avoid React 18 peer dependency constraints

interface Location {
  address: string;
  city: string;
  lat: number;
  lng: number;
}

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  time: string; // ISO
  location: Location;
  avatar?: string;
}

interface SavedLocation {
  _id: string;
  doctorId: string;
  label: string;
  category: string;
  lat: number;
  lng: number;
}

export default function NavigationSchedulingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any | null>(null);
  const leafletRef = useRef<any | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAccessibilityList, setShowAccessibilityList] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${apiBase}/api/schedule/appointments`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error("Failed to load schedule");
        setAppointments(json.data.appointments || []);
        setNextAppointment(json.data.nextAppointment || null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [apiBase]);

  // Filter appointments for selected date (if any)
  const appointmentsForSelectedDate = useMemo(() => {
    if (!selectedDate) return appointments;
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const d = selectedDate.getDate();
    return appointments.filter(a => {
      const dt = new Date(a.time);
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    });
  }, [appointments, selectedDate]);

  // Compute effective next appointment based on either selected date list or overall
  const effectiveNextAppointment = useMemo(() => {
    const list = appointmentsForSelectedDate.length > 0 ? appointmentsForSelectedDate : appointments;
    if (list.length === 0) return null;
    return [...list].sort((a, b) => +new Date(a.time) - +new Date(b.time))[0];
  }, [appointments, appointmentsForSelectedDate]);

  const center = useMemo(() => {
    if (selectedAppointment) return [selectedAppointment.location.lat, selectedAppointment.location.lng] as [number, number];
    // Default to Melbourne CBD
    return [-37.8136, 144.9631] as [number, number];
  }, [selectedAppointment]);

  // Initialize Leaflet map once (client-only dynamic import)
  useEffect(() => {
    let isMounted = true;
    const initMap = async () => {
      if (!mapRef.current || typeof window === 'undefined') return;
      if (leafletMapRef.current) return;
      if (!leafletRef.current) {
        const mod: any = await import('leaflet');
        leafletRef.current = mod.default ?? mod;
      }
      const L = leafletRef.current;
      if (!isMounted) return;
      const map = L.map(mapRef.current).setView(center, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      leafletMapRef.current = map;
      setLeafletReady(true);
    };
    initMap();
    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Keep selected appointment synced with current list (default to earliest)
  useEffect(() => {
    if (effectiveNextAppointment) {
      setSelectedAppointment(effectiveNextAppointment);
    } else {
      setSelectedAppointment(null);
    }
  }, [effectiveNextAppointment]);

  // Update center when selected appointment changes
  useEffect(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(center, 13);
    }
  }, [center]);

  // Render only the selected appointment with a highlighted pin
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;
    const L = leafletRef.current;
    if (!L) return;
    const layerGroup = L.layerGroup().addTo(map);
    if (selectedAppointment) {
      const { lat, lng } = selectedAppointment.location;
      const pinIcon = L.divIcon({
        className: "",
        html: `
          <div style="position: relative; transform: translate(-50%, -100%);">
            <svg width="28" height="36" viewBox="0 0 24 24" fill="#7c3aed" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3))">
              <path d="M12 2C7.582 2 4 5.582 4 10c0 5.25 6.5 12 8 12s8-6.75 8-12c0-4.418-3.582-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/>
            </svg>
          </div>
        `,
        iconSize: [28, 36],
        iconAnchor: [14, 36]
      });
      const marker = L.marker([lat, lng], { icon: pinIcon, zIndexOffset: 1000 }).addTo(layerGroup);
      marker.bindPopup(
        `<div style=\"font-weight:600\">${selectedAppointment.doctorName}</div>` +
        `<div style=\"font-size:12px;color:#4b5563\">${selectedAppointment.location.address}</div>` +
        `<div style=\"font-size:12px;color:#4b5563\">${formatTime(selectedAppointment.time)}</div>`
      );
      setTimeout(() => marker.openPopup(), 250);
    }
    return () => {
      map.removeLayer(layerGroup);
    };
  }, [selectedAppointment, leafletReady]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hour12}:${m} ${ampm}`;
  };

  const startNavigation = () => {
    if (!selectedAppointment) return;
    const destLat = selectedAppointment.location.lat;
    const destLng = selectedAppointment.location.lng;

    const openWithUrl = (url: string) => {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    };

    // Try to include current location when permission is granted; fallback to Google Maps auto-detect
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destLat},${destLng}&travelmode=driving`;
          openWithUrl(url);
        },
        () => {
          const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
          openWithUrl(url);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
      openWithUrl(url);
    }
  };

  const fetchSavedLocations = async (doctorId: string) => {
    try {
      setLoadingLocations(true);
      const res = await fetch(`${apiBase}/api/navigation/locations?doctorId=${encodeURIComponent(doctorId)}`);
      const data = await res.json();
      if (data.success) {
        setSavedLocations(data.data || []);
      } else {
        setSavedLocations([]);
      }
    } catch (e) {
      console.error('Failed to fetch saved locations:', e);
      setSavedLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const showLocationOnMap = (location: SavedLocation) => {
    if (!leafletMapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = leafletMapRef.current;
    
    // Center map on the saved location
    map.setView([location.lat, location.lng], 16);
    
    // Add a marker for the saved location
    const locationIcon = L.divIcon({
      className: "custom-location-icon",
      html: `
        <div style="position: relative;">
          <div style="
            width: 16px; 
            height: 16px; 
            background: #10b981; 
            border: 2px solid white; 
            border-radius: 50%; 
            position: absolute; 
            top: -8px; 
            left: -8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 1000;
          "></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    
    const marker = L.marker([location.lat, location.lng], { icon: locationIcon, zIndexOffset: 1000 }).addTo(map);
    marker.bindPopup(`
      <div style="font-weight:600">${location.label}</div>
      <div style="font-size:12px;color:#4b5563">${location.category}</div>
    `);
    marker.openPopup();
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

        <div className="flex items-center justify-center flex-1">
          <Link href="/dashboard" aria-label="Go to dashboard">
            <Image src={blueLogo} alt="farmaforce" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex items-center space-x-1">
          <Link href="/alerts" aria-label="Go to alerts" className="p-1">
            <Image src={bellIcon} alt="Notifications" className="w-6 h-6" />
          </Link>
          <Link href="/communication" aria-label="Go to communication" className="p-1">
            <Image src={messageIcon} alt="Messages" className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <div className="px-4 py-4 space-y-4">
        <h1 className="text-sm font-semibold text-gray-700">Navigation & Scheduling</h1>

        {/* Calendar */}
        <div className="bg-white rounded-xl border border-[rgba(73,28,124,0.88)]  p-3">
          <div className="flex items-center justify-between mb-2 relative">
            <button
              className="text-sm font-semibold text-[rgba(73,28,124,0.88)] hover:text-[#491C7C]"
              onClick={() => setShowMonthYearPicker(v => !v)}
            >
              {currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </button>
            <div className="flex items-center gap-2 text-gray-500">
              <button className="p-1 hover:text-gray-700" onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>‹</button>
              <button className="p-1 hover:text-gray-700" onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>›</button>
              <button className="p-1 hover:text-gray-700" onClick={() => { const t=new Date(); t.setDate(1); setCurrentMonth(t); setSelectedDate(new Date()); }}>●</button>
            </div>

            {showMonthYearPicker && (
              <div className="absolute z-20 top-8 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Months */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Month</div>
                    <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto pr-1">
                      {Array.from({length:12}).map((_,i)=> (
                        <button
                          key={`m-${i}`}
                          className={`px-2 py-1 rounded text-xs hover:bg-gray-100 ${i===currentMonth.getMonth() ? 'bg-purple-600 text-white' : 'text-gray-700'}`}
                          onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), i, 1))}
                        >
                          {new Date(2000,i,1).toLocaleString(undefined,{month:'short'})}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Years */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Year</div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {(() => {
                        const cy = currentMonth.getFullYear();
                        const years:number[] = [];
                        for (let y = cy - 5; y <= cy + 5; y++) years.push(y);
                        return years.map(y => (
                          <button
                            key={`y-${y}`}
                            className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-100 ${y===cy ? 'bg-purple-50 text-purple-700' : 'text-gray-700'}`}
                            onClick={() => setCurrentMonth(d => new Date(y, d.getMonth(), 1))}
                          >
                            {y}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    className="px-3 py-1.5 text-xs rounded bg-purple-600 text-white hover:bg-purple-700"
                    onClick={() => setShowMonthYearPicker(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-500">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
            {(() => {
              const firstDayIdx = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
              const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
              const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
              const cells: React.ReactNode[] = [];
              // Leading from previous month
              for (let i = firstDayIdx - 1; i >= 0; i--) {
                const day = prevMonthDays - i;
                cells.push(<div key={`p-${i}`} className="py-2 rounded text-gray-300">{day}</div>);
              }
              // Current month
              for (let d = 1; d <= daysInMonth; d++) {
                const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                const isToday = (() => { const t=new Date(); return t.getFullYear()===cellDate.getFullYear() && t.getMonth()===cellDate.getMonth() && t.getDate()===cellDate.getDate(); })();
                const isSelected = selectedDate && selectedDate.getFullYear()===cellDate.getFullYear() && selectedDate.getMonth()===cellDate.getMonth() && selectedDate.getDate()===cellDate.getDate();
                const hasAppt = appointments.some(a => { const ad=new Date(a.time); return ad.getFullYear()===cellDate.getFullYear() && ad.getMonth()===cellDate.getMonth() && ad.getDate()===cellDate.getDate(); });
                cells.push(
                  <button
                    key={`c-${d}`}
                    onClick={() => setSelectedDate(cellDate)}
                    className={`py-2 rounded transition-colors ${isSelected ? 'bg-[rgba(73,28,124,0.88)] text-white' : isToday ? 'bg-purple-50 text-purple-800' : 'hover:bg-gray-100'} ${hasAppt && !isSelected ? 'ring-2 ring-offset-1 ring-[#491C7C]' : ''}`}
                  >
                    {d}
                  </button>
                );
              }
              // Do not render trailing next-month fillers; keep only actual days
              return cells;
            })()}
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">Appointments</div>
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">Failed: {error}</div>
          ) : appointmentsForSelectedDate.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-500">No appointments</div>
          ) : (
            appointmentsForSelectedDate.map(appt => (
              <div key={appt.id} className={`bg-white rounded-xl border p-3 flex items-center justify-between ${selectedAppointment?.id===appt.id ? 'border-[#491C7C]' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {appt.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={appt.avatar} alt={appt.doctorName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div>
                    <button onClick={() => {
                      setSelectedAppointment(appt);
                      setShowAccessibilityList(false); // Hide accessibility list when selecting different doctor
                    }} className="text-sm font-semibold text-gray-900 hover:text-[rgba(73,28,124,0.88)]">
                      {appt.doctorName}
                    </button>
                    <div className="text-[11px] text-gray-500">{appt.specialty}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700 ml-2 shrink-0">
                  <Image src={clockIcon} alt="Time" className="w-4 h-4 inline-block align-middle" />
                  <span className="tabular-nums leading-none">{formatTime(appt.time)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Accessibility Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <Link 
            href="/navigation/locations"
            className="flex items-center justify-center gap-2 text-sm text-[rgba(73,28,124,0.88)] hover:text-purple-700 font-medium transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Accessibility for Clinic
          </Link>
        </div>

        {/* Route Map */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">Route Map</div>
          <div className="h-48 rounded-xl overflow-hidden border border-gray-200">
            <div ref={mapRef} className="w-full h-full" />
          </div>
     
        </div>

        {/* Appointment Detail Card (selected or default) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-900">Appointment Details</div>
            {selectedAppointment && (
              <button 
                onClick={() => {
                  setShowAccessibilityList(!showAccessibilityList);
                  if (!showAccessibilityList) {
                    fetchSavedLocations(selectedAppointment.doctorName);
                  }
                }}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                {showAccessibilityList ? 'Hide' : 'Show'} Accessibility
              </button>
            )}
          </div>
          {selectedAppointment ? (
            <div>
              <div className="text-sm font-medium text-gray-900">{selectedAppointment.doctorName}</div>
              <div className="text-xs text-gray-600">{selectedAppointment.location.address}</div>
              <div className="mt-2 flex items-center gap-6 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <Image src={clockIcon} alt="Time" className="w-4 h-4 inline-block align-middle" />
                  <span className="tabular-nums leading-none">{formatTime(selectedAppointment.time)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Image src={TimePin} alt="Time" className="w-4 h-4" />
                  25 Min
                </div>
              </div>
              
              {/* Accessibility List */}
              {showAccessibilityList && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-700">Saved Locations</div>
                    <Link 
                      href={`/navigation/locations?doctor=${encodeURIComponent(selectedAppointment.doctorName)}`}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Location
                    </Link>
                  </div>
                  {loadingLocations ? (
                    <div className="text-xs text-gray-500">Loading locations...</div>
                  ) : savedLocations.length === 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">No saved locations found</div>
                      <Link 
                        href={`/navigation/locations?doctor=${encodeURIComponent(selectedAppointment.doctorName)}`}
                        className="inline-block text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Add your first accessibility location →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(
                        savedLocations.reduce((acc, loc) => {
                          if (!acc[loc.category]) acc[loc.category] = [];
                          acc[loc.category].push(loc);
                          return acc;
                        }, {} as Record<string, SavedLocation[]>)
                      ).map(([category, locations]) => (
                        <div key={category}>
                          <div className="text-xs font-medium text-gray-600 mb-1">{category}</div>
                          <div className="space-y-1">
                            {locations.map((location) => (
                              <button
                                key={location._id}
                                onClick={() => showLocationOnMap(location)}
                                className="block w-full text-left text-xs text-gray-700 hover:text-purple-600 hover:bg-white p-2 rounded border border-gray-200 hover:border-purple-300 transition-colors"
                              >
                                <div className="font-medium">{location.label}</div>
                                <div className="text-gray-500">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <button onClick={startNavigation} className="mt-4 w-full bg-[#491C7C] hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-medium transition-colors">
                Start Navigation
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No appointment selected</div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-16 right-6 z-50">
        <button className="w-14 h-14 bg-cyan-500 hover:bg-cyan-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}


