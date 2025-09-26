"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import blueLogo from "@/assets/blue logo.png";
import bellIcon from "@/assets/Bell Icon.svg";
import messageIcon from "@/assets/Message Icon.svg";
import Sidebar from "@/components/Sidebar";

interface Doctor {
  id: string;
  name: string;
  clinic?: string;
  lat?: number;
  lng?: number;
  address?: string;
}

interface SavedLocation {
  _id: string;
  doctorId: string;
  label: string;
  category: string;
  lat: number;
  lng: number;
}

const DEFAULT_COORDS = { lat: -37.8136, lng: 144.9631 }; // Melbourne, Australia fallback

export default function ClinicLocationsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showSearchField, setShowSearchField] = useState(true);
  const [isAutoSelected, setIsAutoSelected] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_COORDS);
  const [pin, setPin] = useState<{lat:number;lng:number} | null>(null);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Parking");
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [appointmentDoctors, setAppointmentDoctors] = useState<Doctor[]>([]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any | null>(null);
  const leafletRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const doctorMarkerRef = useRef<any | null>(null);

  // Handle URL parameters for doctor pre-search
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const doctorParam = urlParams.get('doctor');
      if (doctorParam) {
        // Extract just the name part (remove "Dr." prefix if present)
        const nameOnly = doctorParam.replace(/^dr\.?\s*/i, '');
        setSearch(nameOnly);
        setIsAutoSelected(true); // Mark as auto-selection from URL
      }
    }
  }, []);

  // Auto-search when search is set from URL parameter (only for initial auto-selection)
  useEffect(() => {
    if (search && appointmentDoctors.length > 0 && isAutoSelected) {
      const filtered = filterFromAppointments(search);
      if (filtered.length > 0) {
        setDoctors(filtered);
        setShowSuggestions(true);
        // Auto-select the first matching doctor and hide search field
        if (filtered.length === 1) {
          selectDoctor(filtered[0]);
          setShowSearchField(false); // Hide search field when auto-selected
          setIsAutoSelected(false); // Reset auto-selection flag
        }
      }
    }
  }, [search, appointmentDoctors, isAutoSelected]);

  // Init Leaflet map (match navigation page pattern)
  useEffect(() => {
    let isMounted = true;
    const initMap = async () => {
      if (!mapContainerRef.current || typeof window === 'undefined') return;
      if (leafletMapRef.current) return;
      if (!leafletRef.current) {
        const mod: any = await import('leaflet');
        leafletRef.current = mod.default ?? mod;
      }
      const L = leafletRef.current;
      if (!isMounted) return;
      const map = L.map(mapContainerRef.current).setView([mapCenter.lat, mapCenter.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        console.log('Map clicked at:', lat, lng); // Debug log
        
        // Add visual feedback
        const clickMarker = L.circleMarker([lat, lng], {
          radius: 8,
          color: '#7c3aed',
          weight: 3,
          fillColor: '#7c3aed',
          fillOpacity: 0.3,
          zIndexOffset: 999
        }).addTo(map);
        
        // Remove the click feedback after 500ms
        setTimeout(() => {
          map.removeLayer(clickMarker);
        }, 500);
        
        setPin({ lat, lng });
      });
      leafletMapRef.current = map;
      // Fix initial rendering issues when container sizes change
      setTimeout(() => map.invalidateSize(), 100);
      window.addEventListener('resize', handleResizeInvalidate);
      setMapReady(true);
    };
    initMap();
    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      window.removeEventListener('resize', handleResizeInvalidate);
    };
  }, [mapCenter]);

  const handleResizeInvalidate = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.invalidateSize();
    }
  };

  // Update marker when pin changes
  useEffect(() => {
    if (!leafletMapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    if (pin) {
      const pinIcon = L.divIcon({
        className: "custom-pin-icon",
        html: `
          <div style="position: relative;">
            <div style="
              width: 20px; 
              height: 20px; 
              background: #7c3aed; 
              border: 3px solid white; 
              border-radius: 50%; 
              position: absolute; 
              top: -10px; 
              left: -10px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              z-index: 1000;
            "></div>
            <div style="
              width: 2px; 
              height: 20px; 
              background: #7c3aed; 
              position: absolute; 
              top: 10px; 
              left: -1px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            "></div>
          </div>
        `,
        iconSize: [20, 30],
        iconAnchor: [10, 30]
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([pin.lat, pin.lng]);
      } else {
        markerRef.current = L.marker([pin.lat, pin.lng], { icon: pinIcon, zIndexOffset: 1000 }).addTo(leafletMapRef.current);
      }
      leafletMapRef.current.setView([pin.lat, pin.lng], 16);
    } else {
      if (markerRef.current) {
        leafletMapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
  }, [pin]);

  // Use current device location
  const useCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported on this device");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        setPin({ lat: latitude, lng: longitude });
      },
      () => alert("Unable to get your location"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Doctor search (using appointments data only)
  const searchDoctors = async () => {
    try {
      setSearching(true);
      // Use only appointments data since /api/doctors doesn't exist
      const fallback = filterFromAppointments(search);
      setDoctors(fallback);
      setShowSuggestions(true);
    } catch (e) {
      setDoctors([]);
      setShowSuggestions(true);
    } finally {
      setSearching(false);
    }
  };

  // Debounced typeahead
  useEffect(() => {
    if (search.trim().length < 2) {
      setDoctors([]);
      setShowSuggestions(false);
      return;
    }
    const t = setTimeout(() => {
      searchDoctors();
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Prefetch appointments to use as a local fallback source for doctor names
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const res = await fetch(`${apiBase}/api/schedule/appointments`);
        const json = await res.json();
        const appts = (json?.data?.appointments || []) as any[];
        const unique: Record<string, Doctor> = {};
        appts.forEach((a) => {
          const name = a.doctorName || a.name;
          if (!name) return;
          const id = (a.doctorId || name) as string;
          const loc = a.location || a.clinic?.location;
          const lat = typeof loc?.lat === 'number' ? loc.lat : undefined;
          const lng = typeof loc?.lng === 'number' ? loc.lng : undefined;
          if (!unique[id]) unique[id] = { id, name, lat, lng, address: loc?.address };
        });
        setAppointmentDoctors(Object.values(unique));
      } catch (e) {
        setAppointmentDoctors([]);
      }
    };
    loadAppointments();
  }, [apiBase]);

  const filterFromAppointments = (q: string): Doctor[] => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return appointmentDoctors.filter(d => {
      const doctorName = d.name.toLowerCase();
      const searchTerm = s;
      
      // Direct match
      if (doctorName.includes(searchTerm)) return true;
      
      // Remove "Dr." prefix and match
      const nameWithoutPrefix = doctorName.replace(/^dr\.?\s*/i, '');
      if (nameWithoutPrefix.includes(searchTerm)) return true;
      
      // Remove "Dr." from search term and match
      const searchWithoutPrefix = searchTerm.replace(/^dr\.?\s*/i, '');
      if (doctorName.includes(searchWithoutPrefix)) return true;
      
      return false;
    }).slice(0, 20);
  };

  const selectDoctor = async (doc: Doctor) => {
    setSelectedDoctor(doc);
    // Load saved locations for this doctor
    try {
      const res = await fetch(`${apiBase}/api/navigation/locations?doctorId=${encodeURIComponent(doc.id)}`);
      const data = await res.json();
      if (data.success) setLocations(data.data); else setLocations([]);
    } catch (e) {
      setLocations([]);
    }

    // Center on doctor's clinic location from appointments data
    if (typeof doc.lat === 'number' && typeof doc.lng === 'number') {
      centerOnDoctor(doc.lat, doc.lng, doc.name);
    } else {
      // Fallback: try to find the doctor in appointments data
      try {
        const res = await fetch(`${apiBase}/api/schedule/appointments`);
        const json = await res.json();
        const appointments = json?.data?.appointments || [];
        const appointment = appointments.find((apt: any) => 
          (apt.doctorName || apt.name) === doc.name
        );
        if (appointment?.location?.lat && appointment?.location?.lng) {
          centerOnDoctor(appointment.location.lat, appointment.location.lng, doc.name);
        }
      } catch (e) {
        console.log('Could not find doctor location in appointments');
      }
    }
  };

  const centerOnDoctor = (lat: number, lng: number, name: string) => {
    if (!leafletMapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    leafletMapRef.current.setView([lat, lng], 15);
    const pinIcon = L.divIcon({
      className: "",
      html: `
        <div style="position: relative; transform: translate(-50%, -100%);">
          <svg width="28" height="36" viewBox="0 0 24 24" fill="#2563eb" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3))">
            <path d="M12 2C7.582 2 4 5.582 4 10c0 5.25 6.5 12 8 12s8-6.75 8-12c0-4.418-3.582-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/>
          </svg>
        </div>
      `,
      iconSize: [28, 36],
      iconAnchor: [14, 36]
    });
    if (doctorMarkerRef.current) {
      doctorMarkerRef.current.setLatLng([lat, lng]);
      doctorMarkerRef.current.setIcon(pinIcon);
    } else {
      doctorMarkerRef.current = L.marker([lat, lng], { icon: pinIcon, zIndexOffset: 900 }).addTo(leafletMapRef.current);
    }
    if (markerRef.current) markerRef.current.setZIndexOffset(1000);
  };

  const saveLocation = async () => {
    if (!selectedDoctor) return alert("Select a doctor first");
    if (!pin) return alert("Tap on the map to drop a pin");
    if (!label.trim()) return alert("Add a label for this place");
    
    try {
      setSaving(true);
      const res = await fetch(`${apiBase}/api/navigation/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          label: label.trim(),
          category,
          lat: pin.lat,
          lng: pin.lng,
        })
      });
      const data = await res.json();
      if (data.success) {
        setLocations(prev => [data.data, ...prev]);
        setLabel('');
        alert('Location saved successfully');
      } else {
        alert(data.message || 'Failed to save location');
      }
    } catch (e) {
      console.error("Save location error:", e);
      alert(`Failed to save location: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/api/navigation/locations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLocations(prev => prev.filter(l => l._id !== id));
      }
    } catch (e) {}
  };


  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
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
      <div className="w-full max-w-screen-sm mx-auto px-4 py-4 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Clinic Locations</h1>

        {/* Doctor search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          {showSearchField ? (
            <>
              {/* Responsive search bar */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 sm:p-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setHighlightIdx(-1); }}
                      placeholder="Search doctor by name..."
                      className="w-full h-11 bg-white border border-gray-300 rounded-lg px-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                      onFocus={() => { if (doctors.length > 0) setShowSuggestions(true); }}
                      onKeyDown={(e) => {
                        if (!showSuggestions) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, doctors.length - 1)); }
                        if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const doc = highlightIdx >=0 ? doctors[highlightIdx] : doctors[0];
                          if (doc) { selectDoctor(doc); setShowSuggestions(false); }
                        }
                        if (e.key === 'Escape') { setShowSuggestions(false); }
                      }}
                    />
                    {showSuggestions && (
                      <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-md max-h-56 overflow-y-auto z-10">
                        {searching ? (
                          <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                        ) : doctors.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No doctors found</div>
                        ) : (
                          doctors.map((d, idx) => (
                            <button
                              key={d.id}
                              type="button"
                              className={`w-full text-left px-3 py-2 text-sm ${idx===highlightIdx ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                              onClick={() => { selectDoctor(d); setShowSuggestions(false); }}
                              onMouseEnter={() => setHighlightIdx(idx)}
                            >
                              <div className="font-medium text-gray-900">{d.name}</div>
                              {d.clinic && <div className="text-xs text-gray-500">{d.clinic}</div>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={searchDoctors}
                    className={`h-11 px-5 bg-[rgba(73,28,124,0.88)] text-white rounded-lg text-sm font-medium whitespace-nowrap ${searching ? 'opacity-80 cursor-not-allowed' : 'hover:bg-purple-700'}`}
                    disabled={searching}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Inline results panel retained for larger lists when suggestions are closed */}
              {!showSuggestions && doctors.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded">
                  {doctors.map((d) => (
                    <button
                      key={d.id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedDoctor?.id===d.id ? 'bg-purple-50' : ''}`}
                      onClick={() => selectDoctor(d)}
                    >
                      <div className="font-medium text-gray-900">{d.name}</div>
                      {d.clinic && <div className="text-xs text-gray-500">{d.clinic}</div>}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Show selected doctor with option to change */
            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">{selectedDoctor?.name}</div>
                <div className="text-xs text-gray-600">Selected Doctor</div>
              </div>
              <button
                onClick={() => {
                  setShowSearchField(true);
                  setIsAutoSelected(false); // Reset auto-selection state
                  setSearch(''); // Clear search field
                }}
                className="text-xs text-[rgba(73,28,124,0.88)] hover:text-purple-700 font-medium"
              >
                Change Doctor
              </button>
            </div>
          )}

          {selectedDoctor && (
            <div className="text-sm text-gray-700">Selected: <span className="font-medium text-gray-900">{selectedDoctor.name}</span></div>
          )}
        </div>

        {/* Map and add location */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Location</h3>
            <p className="text-sm text-gray-600 mb-3">Tap on the map to drop a pin where the useful location is.</p>
            <div className="flex gap-2">
              <button 
                onClick={useCurrentLocation} 
                className="flex-1 h-11 px-3 bg-[rgba(73,28,124,0.88)] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use my location
              </button>
              <button 
                onClick={() => setPin(null)} 
                className="h-11 px-4 min-w-[110px] bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!pin}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear pin
              </button>
            </div>
          </div>
          <div className="h-48 rounded-xl overflow-hidden border border-gray-200 relative z-0">
            <div 
              ref={mapContainerRef} 
              className="w-full h-full cursor-crosshair" 
              style={{ cursor: 'crosshair' }}
            />
          </div>

          {/* Location Details Form */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Location Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Parking near gate"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                >
                  <option>Parking</option>
                  <option>Lunch</option>
                  <option>Pharmacy</option>
                  <option>Entrance</option>
                  <option>Waiting Area</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={saveLocation} 
                  className={`w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors duration-200 ${saving ? 'bg-[rgba(73,28,124,0.88)] cursor-not-allowed' : 'bg-[rgba(73,28,124,0.88)] hover:bg-purple-700'}`} 
                  disabled={saving || !pin || !label.trim()}
                >
                  {saving ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </div>
            {pin && (
              <div className="mt-3 text-sm text-gray-700 font-medium">
                Pin location: {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
              </div>
            )}
          </div>
        </div>

        {/* Small navigation card */}
        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
          <Link 
            href="/navigation" 
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-[rgba(73,28,124,0.88)] hover:text-purple-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Go to navigation
          </Link>
        </div>

        {/* Saved locations list */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Saved Locations</h2>
            {selectedDoctor && (
              <span className="text-xs text-gray-500">for {selectedDoctor.name}</span>
            )}
          </div>
          {locations.length === 0 ? (
            <p className="text-sm text-gray-500">No locations saved yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locations.map((loc) => (
                <div key={loc._id} className="flex items-center justify-between border border-gray-100 rounded-lg p-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{loc.label}</div>
                    <div className="text-xs text-gray-500">{loc.category} • {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setPin({ lat: loc.lat, lng: loc.lng }); }} className="px-3 py-1.5 text-xs bg-white border border-gray-900 rounded text-black">Show</button>
                    <button onClick={() => deleteLocation(loc._id)} className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded bg-red-50">Delete</button>
                  </div>
                </div>
              ))}
            </div>
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


