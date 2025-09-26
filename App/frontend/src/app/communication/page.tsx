"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import blueLogo from "@/assets/blue logo.png";
import bellIcon from "@/assets/Bell Icon.svg";
import messageIcon from "@/assets/Message Icon.svg";
import inboxIcon from "@/assets/Inbox icon.svg";
import sentIcon from "@/assets/Sent icon.svg";
import draftIcon from "@/assets/darft_3.svg";
import historyIcon from "@/assets/history-icon.svg";
import { communicationAPI } from "@/services/apiService";
import Sidebar from "@/components/Sidebar";

// Removed next/font/google to avoid build error with Turbopack

interface Message {
  id: string;
  sender: string;
  profileImg: string;
  timestamp: string;
  subject: string;
  preview: string;
  isRead: boolean;
  status: 'info' | 'urgent' | 'completed';
  statusText: string;
  type: 'internal' | 'external';
}

const CommunicationPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  // Inbox stream type and reply templates
  const [streamType, setStreamType] = useState<'internal' | 'external'>('internal');

  // Helper: extract basic first/last name from sender like "Dr. Anita Verma"
  const parsePersonName = (full: string) => {
    const honorifics = [/^dr\.?\s*/i, /^mr\.?\s*/i, /^ms\.?\s*/i, /^mrs\.?\s*/i, /^prof\.?\s*/i];
    let cleaned = full.trim();
    honorifics.forEach((h) => {
      cleaned = cleaned.replace(h, '');
    });
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
    return { firstName, lastName };
  };

  // Helper: resolve current user's display name from env or fallback
  const getCurrentUserName = () => {
    return process.env.NEXT_PUBLIC_USER_NAME || 'FarmaForce Representative';
  };

  // Helper: fill simple placeholders for external emails
  const fillPlaceholders = (templateText: string, msg: Message) => {
    if (msg.type !== 'external') return templateText;
    const { firstName, lastName } = parsePersonName(msg.sender);
    return templateText
      .replace(/\[First Name\]/g, firstName || '')
      .replace(/\[Last Name\]/g, lastName || '')
      .replace(/\[Your Name\]/g, getCurrentUserName());
  };

  const internalTemplates = [
    { id: 'ack', label: 'Acknowledgement', text: "Thank you for the update. I'll review and get back to you shortly." },
    { id: 'follow', label: 'Follow-up', text: 'Following up on this. Do you have any updates to share?' },
    { id: 'meeting', label: 'Meeting Confirmation', text: 'Confirming our meeting. Looking forward to discussing this further.' }
  ];

  const externalTemplates = [
    { id: 'intro', label: 'Introduction', text: 'Hello Dr. [Last Name], I hope you are well. I am [Your Name] from FarmaForce. I would like to briefly introduce our [Product/Program].' },
    { id: 'meeting-invite', label: 'Meeting Invite', text: 'Hello Dr. [Last Name], could we schedule a brief 15-minute call this week to discuss [topic]? Please share a suitable time.' },
    { id: 'follow-up-ext', label: 'Follow-up', text: 'Hello Dr. [Last Name], following up on my previous message regarding [topic]. Happy to provide any additional information.' },
    { id: 'thank-you', label: 'Thank You', text: 'Hello Dr. [Last Name], thank you for your time today. As discussed, I will share the requested materials shortly.' },
    { id: 'proposal', label: 'Proposal/Quote', text: 'Hello Dr. [Last Name], please find attached the proposal for [Product/Service]. Let me know if you would like any adjustments.' },
    { id: 'product-info', label: 'Product Information', text: 'Hello Dr. [Last Name], sharing the key information and recent updates on [Product]. Please let me know if you need anything else.' },
    { id: 'samples-reply', label: 'Samples Request Reply', text: 'Hello Dr. [Last Name], your sample request has been received. We will arrange [quantity] sample packs by [date].' },
    { id: 'apology', label: 'Apology', text: 'Hello Dr. [Last Name], apologies for the inconvenience caused. We are looking into this and will resolve it at the earliest.' },
    { id: 'availability', label: 'Availability Confirmation', text: 'Hello Dr. [Last Name], I am available on [date/time]. Please confirm if the slot works for you.' },
    { id: 'send-materials', label: 'Share Materials', text: 'Hello Dr. [Last Name], attaching the clinical materials on [Product/Topic] as requested. Please let me know if you would like a summary call.' },
    { id: 'pricing', label: 'Pricing/Quotation', text: 'Hello Dr. [Last Name], please find pricing details for [Product/Service] attached. I am happy to discuss volume-based options.' },
    { id: 'gentle-reminder', label: 'Gentle Reminder', text: 'Hello Dr. [Last Name], just a quick reminder regarding [topic/action]. Please let me know if you need more time or information.' },
    { id: 'reschedule', label: 'Reschedule Meeting', text: 'Hello Dr. [Last Name], due to [reason], may we reschedule our meeting to [new date/time]? Apologies for the inconvenience.' },
    { id: 'no-response', label: 'No Response Nudge', text: 'Hello Dr. [Last Name], checking if you had a chance to review my previous note. I can share a brief overview if helpful.' },
    { id: 'welcome', label: 'Welcome/Onboarding', text: 'Hello Dr. [Last Name], welcome to [Program]. Here are the next steps and key contacts. I will be your point of contact.' },
    { id: 'feedback', label: 'Feedback Request', text: 'Hello Dr. [Last Name], could you please share your feedback on [Product/Experience]? Your inputs help us improve.' },
    { id: 'event-invite', label: 'Event Invite', text: 'Hello Dr. [Last Name], you are invited to our upcoming session on [topic] on [date/time]. Shall I register you?' }
  ];

  const currentTemplates = useMemo(() => (streamType === 'internal' ? internalTemplates : externalTemplates), [streamType]);

  const [replyForId, setReplyForId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(internalTemplates[0].id);
  const [replyText, setReplyText] = useState<string>('');
  const [replySendingId, setReplySendingId] = useState<string | null>(null);
  const [templateMenuOpen, setTemplateMenuOpen] = useState<boolean>(false);
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    cc: "",
    message: ""
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [cloudAttachments, setCloudAttachments] = useState<{filename: string; url: string}[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // When stream type changes, default the template selection appropriately
    setSelectedTemplateId(currentTemplates[0].id);
    if (replyForId) {
      const msg = messages.find(m => m.id === replyForId);
      const defaultText = currentTemplates[0].text;
      setReplyText(msg ? fillPlaceholders(defaultText, msg) : defaultText);
    }
  }, [streamType]);

  const tabs = [
    { id: "Inbox", label: "Inbox", icon: inboxIcon },
    { id: "Sent", label: "Sent", icon: sentIcon },
    { id: "Draft", label: "Draft", icon: draftIcon },
    { id: "History", label: "History", icon: historyIcon }
  ];

  // History state
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      if (activeTab !== 'History') return;
      try {
        setHistoryLoading(true);
        const data = await communicationAPI.getHistory(1, 50);
        if (data?.success) setHistoryItems(data.data);
      } catch (e) {
        console.error('History load failed', e);
      } finally {
        setHistoryLoading(false);
      }
    };
    load();
  }, [activeTab]);

  // Load initial data and drafts
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockMessages: Message[] = [
          {
            id: "1",
            sender: "Marketing Team",
            profileImg: "/api/placeholder/40/40?text=MT",
            timestamp: "Today, 10:30 AM",
            subject: "Upcoming Conference: Pharmaceutical Innovation Summit",
            preview: "Join us for the annual Pharmaceutical Innovation Summit next month. Early registration closes this Friday.",
            isRead: false,
            status: 'info',
            statusText: 'Information',
            type: 'internal'
          },
          {
            id: "2",
            sender: "Product Safety",
            profileImg: "/api/placeholder/40/40?text=PS",
            timestamp: "Today, 10:30 AM",
            subject: "Urgent: Product Update for Cardiomax",
            preview: "Important safety information update for Cardiomax. Please review the attached documents before your next sales call.",
            isRead: false,
            status: 'urgent',
            statusText: 'Urgent',
            type: 'internal'
          },
          {
            id: "3",
            sender: "HR Department",
            profileImg: "/api/placeholder/40/40?text=HR",
            timestamp: "Today, 10:30 AM",
            subject: "Your Q4 Performance Review is Complete",
            preview: "Your quarterly performance review has been completed. You've exceeded targets by 15%. View detailed report.",
            isRead: true,
            status: 'completed',
            statusText: 'Completed',
            type: 'internal'
          },
          {
            id: "4",
            sender: "Dr. Anita Verma",
            profileImg: "/api/placeholder/40/40?text=AV",
            timestamp: "Yesterday, 5:12 PM",
            subject: "Samples Request for Cardiomax",
            preview: "Can you arrange 10 sample packs for our clinic this week?",
            isRead: true,
            status: 'info',
            statusText: 'Information',
            type: 'external'
          }
        ];
        
        setMessages(mockMessages);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/communication/drafts');
        const data = await res.json();
        if (data.success) setDrafts(data.data);
      } catch (e) {}
    };

    loadDrafts();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'info':
        return (
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">i</span>
          </div>
        );
      case 'urgent':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        );
      case 'completed':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const handleMarkAsRead = (messageId: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, isRead: !msg.isRead } : msg
    ));
  };

  const handleReply = (messageId: string) => {
    setReplyForId(prev => (prev === messageId ? null : messageId));
    const defaultTemplate = currentTemplates.find(t => t.id === selectedTemplateId) || currentTemplates[0];
    const msg = messages.find(m => m.id === messageId);
    const text = msg ? fillPlaceholders(defaultTemplate.text, msg) : defaultTemplate.text;
    setReplyText(text);
  };

  const resolveRecipientEmail = (msg: Message) => {
    if (msg.sender === 'Marketing Team') return 'shreyp693@gmail.com';
    // Fallback for demo; could be extended with a directory
    return 'shreyp693@gmail.com';
  };

  const sendInlineReply = async (msg: Message) => {
    try {
      setReplySendingId(msg.id);
      const to = resolveRecipientEmail(msg);
      const subject = `Re: ${msg.subject}`;
      const personalized = fillPlaceholders(replyText, msg);
      const decorativeHtml = `
        <div style="font-family: Inter, Arial, sans-serif; color:#111;">
          <div style="padding:16px;border-left:4px solid #7c3aed;background:#faf5ff;border-radius:8px;">
            <div style="white-space:pre-wrap;line-height:1.7;font-size:14px;">${personalized}</div>
          </div>
          <div style="margin-top:16px;color:#6b7280;font-size:12px;">— Sent via FarmaForce Communication</div>
        </div>
      `;
      const form = new FormData();
      form.append('to', to);
      form.append('subject', subject);
      form.append('message', decorativeHtml);
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/communication/send-email`, { method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: form });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to send');
      alert('Reply sent successfully');
      try {
        const token2 = localStorage.getItem('token');
        const resH = await fetch(`${apiBase}/api/communication/history`, { headers: { ...(token2 ? { Authorization: `Bearer ${token2}` } : {}) } });
        const dataH = await resH.json();
        if (dataH.success) setHistoryItems(dataH.data);
      } catch (e) {}
      setReplyForId(null);
    } catch (e:any) {
      alert(e.message || 'Failed to send reply');
    } finally {
      setReplySendingId(null);
    }
  };

  const handleComposeChange = (field: string, value: string) => {
    setComposeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSend = async () => {
    try {
      // Validate required fields
      if (!composeData.to.trim()) {
        alert('Please enter a recipient email address');
        return;
      }
      if (!composeData.subject.trim()) {
        alert('Please enter a subject');
        return;
      }
      if (!composeData.message.trim()) {
        alert('Please enter a message');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('to', composeData.to.trim());
      formData.append('subject', composeData.subject.trim());
      formData.append('message', composeData.message.trim());
      
      if (composeData.cc.trim()) {
        formData.append('cc', composeData.cc.trim());
      }

      if (cloudAttachments.length > 0) {
        formData.append('existingAttachments', JSON.stringify(cloudAttachments));
      }

      if (activeDraftId) {
        formData.append('draftId', activeDraftId);
      }

      // Add attachments
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      // Show loading state
      setIsSending(true);

      // Send email
      const token3 = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/api/communication/send-email`, {
        method: 'POST',
        headers: { ...(token3 ? { Authorization: `Bearer ${token3}` } : {}) },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert('Email sent successfully!');
        // Reset form
        setComposeData({
          to: "",
          subject: "",
          cc: "",
          message: ""
        });
        setAttachments([]);
        setCloudAttachments([]);
        setActiveDraftId(null);
        // refresh drafts and history
        try {
          const res = await fetch(`${apiBase}/api/communication/drafts`);
          const data = await res.json();
          if (data.success) setDrafts(data.data);
        } catch (e) {}
        try {
          const token4 = localStorage.getItem('token');
          const resH2 = await fetch(`${apiBase}/api/communication/history`, { headers: { ...(token4 ? { Authorization: `Bearer ${token4}` } : {}) } });
          const dataH2 = await resH2.json();
          if (dataH2.success) setHistoryItems(dataH2.data);
        } catch (e) {}
        try {
          const token2 = localStorage.getItem('token');
          const resH = await fetch(`${apiBase}/api/communication/history`, { headers: { ...(token2 ? { Authorization: `Bearer ${token2}` } : {}) } });
          const dataH = await resH.json();
          if (dataH.success) setHistoryItems(dataH.data);
        } catch (e) {}
      } else {
        alert(`Failed to send email: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      // Reset button state
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      if (!composeData.to.trim() || !composeData.subject.trim() || !composeData.message.trim()) {
        alert('To, Subject and Message are required');
        return;
      }

      const formData = new FormData();
      formData.append('to', composeData.to.trim());
      formData.append('subject', composeData.subject.trim());
      formData.append('message', composeData.message.trim());
      if (composeData.cc.trim()) formData.append('cc', composeData.cc.trim());
      attachments.forEach((file) => formData.append('attachments', file));

      const res = await fetch('http://localhost:5000/api/communication/drafts', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setDrafts(prev => [data.data, ...prev]);
        // Clear compose area and states after saving
        setComposeData({ to: "", subject: "", cc: "", message: "" });
        setAttachments([]);
        setCloudAttachments([]);
        setActiveDraftId(null);
        // Navigate to Draft tab to show saved draft
        setActiveTab('Draft');
        alert('Draft saved');
      } else {
        alert(data.message || 'Failed to save draft');
      }
    } catch (e) {
      alert('Failed to save draft');
    }
  };

  const handleOpenDraft = (draft: any) => {
    setComposeData({
      to: draft.to || '',
      subject: draft.subject || '',
      cc: (draft.cc || []).join(', '),
      message: draft.message || ''
    });
    setCloudAttachments((draft.attachments || []).map((a: any) => ({ filename: a.filename, url: a.url })));
    setAttachments([]);
    setActiveDraftId(draft._id);
    setActiveTab('Sent');
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/communication/drafts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDrafts(prev => prev.filter(d => d._id !== id));
      } else {
        alert('Failed to delete draft');
      }
    } catch (e) {
      alert('Failed to delete draft');
    }
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments = Array.from(files);
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const renderContent = () => {
    if (activeTab === "Sent") {
      return (
        <div className="bg-purple-50 rounded-lg p-6 border border-[rgba(73,28,124,0.88)]">
          {/* Input Fields */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 w-16">To:</span>
              <div className="flex-1 border-b-2 border-dotted border-gray-300 ml-2 pb-1">
                <input
                  type="text"
                  value={composeData.to}
                  onChange={(e) => handleComposeChange('to', e.target.value)}
                  placeholder="Enter recipient email"
                  className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 w-16">Subject:</span>
              <div className="flex-1 border-b-2 border-dotted border-gray-300 ml-2 pb-1">
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => handleComposeChange('subject', e.target.value)}
                  placeholder="Enter subject"
                  className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 w-16">CC:</span>
              <div className="flex-1 border-b-2 border-dotted border-gray-300 ml-2 pb-1">
                <input
                  type="text"
                  value={composeData.cc}
                  onChange={(e) => handleComposeChange('cc', e.target.value)}
                  placeholder="Enter CC email(s), comma-separated"
                  className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Message Area */}
          <div className="mb-6">
            <textarea
              value={composeData.message}
              onChange={(e) => handleComposeChange('message', e.target.value)}
              placeholder="Write your message here..."
              className="w-full h-32 p-3 border border-purple-200 rounded-lg bg-white resize-none outline-none text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Attachments Section */}
          {attachments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachment Button */}
          <div className="mb-6">
            <input
              type="file"
              id="attachment"
              multiple
              onChange={handleAttachmentChange}
              className="hidden"
            />
            <label
              htmlFor="attachment"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-purple-300 rounded-lg text-[rgba(73,28,124,0.88)] text-sm font-medium hover:bg-purple-50 cursor-pointer transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Add Attachment
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={isSending}
              className={`px-6 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                isSending 
                  ? 'bg-purple-400 cursor-not-allowed' 
                  : 'bg-[rgba(73,28,124,0.88)] hover:bg-purple-700'
              }`}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
            <button
              onClick={handleSaveDraft}
              className="px-6 py-2 bg-white text-[rgba(73,28,124,0.88)] text-sm font-medium rounded-lg border border-[rgba(73,28,124,0.88)] hover:bg-purple-50 transition-colors"
            >
              Save Draft
            </button>
          </div>
        </div>
      );
    }

    // History content
    if (activeTab === 'History') {
      return (
        <div className="space-y-3">
          {historyLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgba(73,28,124,0.88)]"></div>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">No history yet</div>
          ) : (
            historyItems.map((h) => {
              const isOpen = !!expandedIds[h._id];
              const preview = h.message?.replace(/<[^>]+>/g, '') || '';
              const short = preview.length > 200 ? preview.slice(0, 200) + '…' : preview;
              return (
                <div key={h._id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-3">
                      <div className="text-sm font-semibold text-gray-800 truncate">{h.subject}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">To: {h.to}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(h.createdAt).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => setExpandedIds(prev => ({ ...prev, [h._id]: !isOpen }))}
                      className="text-[rgba(73,28,124,0.88)] text-xs font-medium hover:text-purple-700"
                    >
                      {isOpen ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {isOpen ? (
                      <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: h.message }} />
                    ) : (
                      <p className="line-clamp-4 whitespace-pre-wrap break-words">{short}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      );
    }

    // Default Inbox/Draft content
    return (
      <>
        {/* Internal/External stream toggle */}
        {activeTab === 'Inbox' && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setStreamType('internal')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${streamType==='internal' ? 'bg-[rgba(73,28,124,0.88)] text-white border-[rgba(73,28,124,0.88)]' : 'bg-white text-black border-gray-300'}`}
            >
              Internal
            </button>
            <button
              onClick={() => setStreamType('external')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${streamType==='external' ? 'bg-[rgba(73,28,124,0.88)] text-white border-[rgba(73,28,124,0.88)]' : 'bg-white text-black border-gray-300'}`}
            >
              External
            </button>
          </div>
        )}
        {/* Draft List when Draft tab is active */}
        {activeTab === 'Draft' ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1">
            {drafts.map((d) => (
              <div key={d._id} className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex justify-between items-start">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenDraft(d)}>
                  <div className="font-semibold text-sm text-gray-800 truncate">{d.subject}</div>
                  <div className="text-xs text-gray-600 truncate mt-1">{d.message}</div>
                </div>
                <button onClick={() => handleDeleteDraft(d._id)} className="ml-3 text-gray-500 hover:text-red-600">
                  ✕
                </button>
              </div>
            ))}
            {drafts.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">No drafts saved</p>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.filter(m => activeTab==='Inbox' ? m.type===streamType : true).map((message) => (
              <div
                key={message.id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {message.sender === "Marketing Team" ? (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-700">MT</span>
                        </div>
                      ) : message.sender === "Product Safety" ? (
                        <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-red-700">PS</span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-green-700">HR</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header with Status Icon */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {message.sender}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {message.timestamp}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mb-2 leading-tight">
                          {message.subject}
                        </h4>
                      </div>
                      
                      {/* Status Icon */}
                      <div className="flex-shrink-0 ml-2">
                        {getStatusIcon(message.status)}
                      </div>
                    </div>

                    {/* Message Preview */}
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                      {message.preview}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleMarkAsRead(message.id)}
                        className="text-[rgba(73,28,124,0.88)] text-sm font-medium hover:text-blue-700 transition-colors"
                      >
                        {message.isRead ? "Mark as unread" : "Mark as read"}
                      </button>
                      <button
                        onClick={() => handleReply(message.id)}
                        className="text-[rgba(73,28,124,0.88)] text-sm font-medium hover:text-blue-700 transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
                {/* Inline Reply Box with templates */}
                {activeTab === 'Inbox' && replyForId === message.id && (
                  <div className="mt-3 border-t pt-3 max-h-72 overflow-y-auto overflow-x-hidden pr-1">
                    <div className="flex items-center gap-2 mb-2 relative">
                      <label className="text-xs text-gray-600">Template:</label>
                      <button
                        type="button"
                        onClick={() => setTemplateMenuOpen(prev => !prev)}
                        className="text-xs text-black bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-200 min-w-[180px] text-left"
                      >
                        {currentTemplates.find(t => t.id === selectedTemplateId)?.label || 'Select template'}
                      </button>
                      {templateMenuOpen && (
                        <div className="absolute left-16 top-6 z-10 w-64 bg-white border border-gray-300 rounded shadow-md max-h-56 overflow-y-auto overflow-x-hidden">
                          {currentTemplates.map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setSelectedTemplateId(t.id);
                                setReplyText(fillPlaceholders(t.text, message));
                                setTemplateMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs text-gray-900 hover:bg-gray-100 ${selectedTemplateId===t.id ? 'bg-gray-50 font-medium' : ''}`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full h-24 p-2 text-sm text-black placeholder-black/60 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-200"
                      placeholder="Type your reply..."
                    />
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <button
                        onClick={() => sendInlineReply(message)}
                        disabled={replySendingId === message.id}
                        className={`px-4 py-2 text-xs rounded text-white ${replySendingId===message.id ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                      >
                        {replySendingId === message.id ? 'Sending...' : 'Send Reply'}
                      </button>
                      <button
                        onClick={() => setReplyForId(null)}
                        className="px-4 py-2 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">No messages found</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={"min-h-screen bg-gray-50"}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header - match Dashboard */}
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
        <h1 className="text-2xl font-bold text-gray-800">Communication</h1>
        
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Navigation Tabs (always 1 row at small widths) */}
          <div className="flex items-stretch border-b border-gray-200 pb-1 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-1 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'text-[rgba(73,28,124,0.88)]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={14}
                  height={14}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}
                />
                <span className="truncate">{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute -bottom-[5px] left-1 right-1 h-0.5 bg-[rgba(73,28,124,0.88)] rounded" />
                )}
              </button>
            ))}
          </div>

          {/* Dynamic Content */}
          {renderContent()}
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
};

export default CommunicationPage;
