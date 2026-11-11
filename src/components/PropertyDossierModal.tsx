/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Property, InteractionLog, TracingStatus, SiteCondition } from '../types/property';
import { PropertyStorageService } from '../services/propertyStorage';
import { PropertyMap } from './PropertyMap';
import { GoogleMapsPropertyView } from './GoogleMapsPropertyView';
import {
  X,
  Building,
  FileText,
  Camera,
  History,
  PhoneCall,
  Send,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Calendar,
  User,
  CreditCard,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  MessageSquare,
  Edit2,
  Check,
  Share2
} from 'lucide-react';

interface PropertyDossierModalProps {
  property: Property;
  onClose: () => void;
  onOpenNewInteraction: (property: Property) => void;
  onOpenPhotoLightbox: (photoUrl: string, caption?: string) => void;
  onPropertyUpdated: (updated: Property) => void;
}

export const PropertyDossierModal: React.FC<PropertyDossierModalProps> = ({
  property,
  onClose,
  onOpenNewInteraction,
  onOpenPhotoLightbox,
  onPropertyUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'legal' | 'audit' | 'map' | 'timeline' | 'outreach'>('legal');
  const [mapProvider, setMapProvider] = useState<'google' | 'cadastral'>('google');
  const [isEditingAudit, setIsEditingAudit] = useState(false);
  const [editSiteCondition, setEditSiteCondition] = useState<SiteCondition>(property.site_condition);
  const [editSiteDescription, setEditSiteDescription] = useState(property.site_description || '');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const interactions = PropertyStorageService.getInteractionsForProperty(property.id, property.house_no);

  const handleStatusChange = (newStatus: TracingStatus) => {
    const updated = PropertyStorageService.updatePropertyTracingStatus(property.id, newStatus);
    if (updated) {
      onPropertyUpdated(updated);
    }
  };

  const handleSaveAudit = () => {
    const updated = PropertyStorageService.updatePropertyDetails(property.id, {
      site_condition: editSiteCondition,
      site_description: editSiteDescription,
    });
    if (updated) {
      onPropertyUpdated(updated);
      setIsEditingAudit(false);
    }
  };

  // WhatsApp template generator in Bahasa Malaysia
  const whatsAppMessage = `Salam Sejahtera ${property.buyer_primary || 'Tuan/Puan'},

Saya pegawai penyelaras daripada Pasukan Pemulihan & Dokumentasi Projek Taman Seri Gedung. 

Kami sedang mengemaskini rekod geran dan hakmilik bagi kediaman No. ${property.house_no}, ${property.street_name} (Lot ${property.cadastral_lot_no}). 

Mohon maklumbalas tuan/puan atau waris terdekat bagi urusan penyelesaian Borang 14A (Pindah Milik) dan status cukai pintu MPSPK. Terima kasih.`;

  const copyWhatsApp = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg">
              #{property.house_no}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  No. {property.house_no}, {property.street_name}
                </h2>
              </div>
              <p className="text-xs text-slate-300 font-mono flex items-center gap-2 mt-0.5">
                <span>{property.cadastral_lot_no}</span>
                <span>·</span>
                <span>PT {property.pt_no}</span>
                <span>·</span>
                <span>{property.house_type_category || '1-S Terrace'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Inline Tracing Status Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Status:</span>
              <select
                value={property.tracing_status}
                onChange={(e) => handleStatusChange(e.target.value as TracingStatus)}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Pending Outreach" className="bg-slate-800 text-white">Pending Outreach</option>
                <option value="Contact Established" className="bg-slate-800 text-white">Contact Established</option>
                <option value="Follow-up Required" className="bg-slate-800 text-white">Follow-up Required</option>
                <option value="Negotiating Transfer" className="bg-slate-800 text-white">Negotiating Transfer</option>
                <option value="Untraceable" className="bg-slate-800 text-white">Untraceable</option>
                <option value="Completed" className="bg-slate-800 text-white">Completed (Borang 14A)</option>
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Close dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 sm:px-6 gap-2 sm:gap-6 overflow-x-auto text-xs font-semibold text-slate-600 shrink-0">
          <button
            onClick={() => setActiveTab('legal')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'legal'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Land Title & 1988 SPA</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Physical Site Audit ({property.site_photo_urls.length} Photos)</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'map'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Cadastral Map & Location</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'timeline'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Outreach CRM Timeline ({interactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('outreach')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'outreach'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Quick Outreach Actions</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: LAND TITLE & LEGAL PARTICULARS */}
          {activeTab === 'legal' && (
            <div className="space-y-6">
              {/* Arrears Alert Banner if > 0 */}
              {property.cukai_pintu_arrears > 0 ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-rose-900 text-sm">
                      Outstanding Cukai Pintu Arrears: RM {property.cukai_pintu_arrears.toFixed(2)}
                    </div>
                    <p className="text-rose-700 mt-1">
                      Majlis Perbandaran Sungai Petani (MPSPK) assessment tax has outstanding arrears recorded. Regularization of Geran title will require settlement or council amnesty clearance.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cukai Pintu Assessment Tax is fully paid (RM 0.00 outstanding).</span>
                </div>
              )}

              {/* Land Office Identifiers Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pejabat Tanah & Ukur (Electronic Land Registry)
                  </h3>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>View on Cadastral Map</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-sans">Cadastral Lot No</span>
                    <strong className="text-slate-900 text-sm">{property.cadastral_lot_no}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-sans">Electronic Geran Title</span>
                    <strong className="text-slate-900 text-sm truncate block">
                      {property.geran_no || <span className="text-amber-600 font-sans font-normal italic">Pending Issue</span>}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-sans">PT Number</span>
                    <strong className="text-slate-900 text-sm">PT {property.pt_no}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-sans">1988 HSD Title</span>
                    <strong className="text-slate-900 text-sm">{property.hsd_no}</strong>
                  </div>
                </div>
              </div>

              {/* Ownership & 1988 SPA Particulars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1988 Historical SPA */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>1988 Original SPA Purchaser</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Primary Purchaser:</span>
                      <span className="font-semibold text-slate-900 text-sm">{property.buyer_primary}</span>
                    </div>
                    {property.buyer_secondary && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Joint Purchaser / Waris:</span>
                        <span className="font-semibold text-slate-800">{property.buyer_secondary}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-sans">New MyKad (12-digit):</span>
                        <span className="text-slate-800">{property.ic_new || 'Not recorded'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans">Old IC / Police / Army:</span>
                        <span className="text-slate-800">{property.ic_old_police_army || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-400 block text-[11px]">Historical Correspondence:</span>
                      <span className="text-slate-700 text-[11px]">{property.mailing_address || 'No registered address'}</span>
                    </div>
                  </div>
                </div>

                {/* Current Proprietor & Financing */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Financing & Modern Title Status</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Current Registered Proprietor:</span>
                      <span className="font-semibold text-slate-900 text-sm">
                        {property.current_registered_owner || property.buyer_primary}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">1988 Loan Provider:</span>
                      <span className="font-semibold text-slate-800">
                        {property.loan_provider || 'Self-financed / Cash'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Historical File Status:</span>
                      <p className="text-slate-700 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                        {property.historical_status || 'Documentation complete.'}
                      </p>
                    </div>
                    {property.case_admin_notes && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Estate / Waris Administration Notes:</span>
                        <p className="text-amber-900 text-xs bg-amber-50 p-2 rounded border border-amber-200">
                          {property.case_admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHYSICAL SITE AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Physical Site Audit & Survey Findings</h3>
                  <p className="text-xs text-slate-500">Inspection date: {property.site_survey_date || '2021-04-18'}</p>
                </div>
                {!isEditingAudit ? (
                  <button
                    onClick={() => setIsEditingAudit(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Update Audit Findings</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingAudit(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAudit}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Condition Editor / Display */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                {isEditingAudit ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Site Condition</label>
                      <select
                        value={editSiteCondition}
                        onChange={(e) => setEditSiteCondition(e.target.value as SiteCondition)}
                        className="w-full sm:w-60 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                      >
                        <option value="Abandon">Abandon (Vacant & Neglected)</option>
                        <option value="Occupied">Occupied (Residents Active)</option>
                        <option value="Renovation">Under Renovation</option>
                        <option value="Unknown">Unknown / Locked Gate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Observation & Meter Notes</label>
                      <textarea
                        rows={3}
                        value={editSiteDescription}
                        onChange={(e) => setEditSiteDescription(e.target.value)}
                        placeholder="Observation notes: TNB electrical meter presence, roof structural integrity, gate condition..."
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-500">Condition Status:</span>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        property.site_condition === 'Abandon' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        property.site_condition === 'Occupied' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        property.site_condition === 'Renovation' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {property.site_condition.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 block mb-1">Field Observations:</span>
                      <p className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                        {property.site_description || 'No specific field notes recorded.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Gallery Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span>On-Site Condition Photos</span>
                </h4>
                {property.site_photo_urls.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-xs">
                    No field survey photos attached for this unit.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {property.site_photo_urls.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => onOpenPhotoLightbox(photoUrl, `Unit #${property.house_no} - Site Inspection Photo`)}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-2xs aspect-4/3 cursor-pointer bg-slate-100"
                      >
                        <img
                          src={photoUrl}
                          alt={`Unit ${property.house_no} site photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 text-white text-xs font-medium">
                          <span>Click to expand high-resolution photo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CADASTRAL & GOOGLE MAPS LOCATION */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              {/* Map Engine Toggle */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setMapProvider('google')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      mapProvider === 'google'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Google Maps Platform™ View
                  </button>
                  <button
                    onClick={() => setMapProvider('cadastral')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      mapProvider === 'cadastral'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Taman Seri Gedung Cadastral Plan
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
                  Lot: {property.cadastral_lot_no} · Mukim Sungai Petani
                </div>
              </div>

              {mapProvider === 'google' ? (
                <GoogleMapsPropertyView property={property} />
              ) : (
                <PropertyMap
                  property={property}
                  onSelectNeighborProperty={(neighbor) => onPropertyUpdated(neighbor)}
                />
              )}
            </div>
          )}

          {/* TAB 3: TRACING & INTERACTION TIMELINE (CRM) */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Owner Outreach & Legal Timeline</h3>
                  <p className="text-xs text-slate-500">Reverse chronological history of touchpoints with owner or heirs.</p>
                </div>
                <button
                  onClick={() => onOpenNewInteraction(property)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Log New Interaction</span>
                </button>
              </div>

              {interactions.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">No Outreach Logs Yet</h4>
                    <p className="text-xs text-slate-500 mt-1">This property is currently in "{property.tracing_status}" stage.</p>
                  </div>
                  <button
                    onClick={() => onOpenNewInteraction(property)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    <span>Record First Contact</span>
                  </button>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 pl-4 ml-3 space-y-6">
                  {interactions.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-900 group-hover:scale-125 transition-transform" />

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{log.party_contacted}</span>
                            <span className="text-slate-500">({log.relationship})</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-medium text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded text-[11px]">
                              {log.channel}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(log.interaction_timestamp).toLocaleString('en-MY', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        {/* Outcome badge */}
                        <div>
                          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                            log.outcome === 'Agreed to Borang 14A' ? 'bg-indigo-100 text-indigo-800' :
                            log.outcome === 'Documents Collected' ? 'bg-emerald-100 text-emerald-800' :
                            log.outcome === 'Follow-up Required' ? 'bg-amber-100 text-amber-800' :
                            log.outcome === 'Dispute' || log.outcome === 'Refused' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            Outcome: {log.outcome}
                          </span>
                        </div>

                        {/* Detailed Notes */}
                        <p className="text-xs text-slate-800 leading-relaxed bg-white p-2.5 rounded border border-slate-100">
                          {log.detailed_notes}
                        </p>

                        {/* Metadata footer */}
                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                          <div className="flex items-center gap-3">
                            {log.phone_dialed && (
                              <span>Contacted: {log.phone_dialed}</span>
                            )}
                            {log.next_follow_up_date && (
                              <span className="text-amber-800 font-medium font-sans">
                                Next Follow-up: {log.next_follow_up_date}
                              </span>
                            )}
                          </div>
                          <div>Recorded by: {log.recorded_by}</div>
                        </div>

                        {/* Attached docs links */}
                        {log.docs_collected_urls && log.docs_collected_urls.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                            {log.docs_collected_urls.map((docUrl, dIdx) => (
                              <a
                                key={dIdx}
                                href={docUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Attached Legal Document {dIdx + 1}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUICK OUTREACH ACTIONS */}
          {activeTab === 'outreach' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Direct Outreach & Messaging Tools</h3>
                <p className="text-xs text-slate-500">Contact original purchasers, surviving waris, or legal representatives directly.</p>
              </div>

              {/* Telephone Dialer */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Telephone Quick Dial</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {property.tel_mobile && (
                    <a
                      href={`tel:${property.tel_mobile.replace(/[^0-9]/g, '')}`}
                      className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-900 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mobile Contact</span>
                        <strong className="text-slate-900 font-mono text-sm">{property.tel_mobile}</strong>
                      </div>
                      <PhoneCall className="w-4 h-4 text-emerald-600" />
                    </a>
                  )}
                  {property.tel_fixed && (
                    <a
                      href={`tel:${property.tel_fixed.replace(/[^0-9]/g, '')}`}
                      className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-900 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="text-slate-400 block text-[10px]">Landline Contact</span>
                        <strong className="text-slate-900 font-mono text-sm">{property.tel_fixed}</strong>
                      </div>
                      <PhoneCall className="w-4 h-4 text-emerald-600" />
                    </a>
                  )}
                </div>
              </div>

              {/* WhatsApp Template Generator */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>WhatsApp Revitalization Outreach Template (Bahasa Malaysia)</span>
                  </h4>
                  <button
                    onClick={copyWhatsApp}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedWhatsApp ? 'Copied to Clipboard!' : 'Copy Template'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={6}
                  value={whatsAppMessage}
                  className="w-full text-xs font-mono p-3 bg-white border border-emerald-200 rounded-lg text-slate-800 focus:outline-none"
                />
                {property.tel_mobile && (
                  <div className="pt-1">
                    <a
                      href={`https://wa.me/60${property.tel_mobile.replace(/[^0-9]/g, '').replace(/^0/, '')}?text=${encodeURIComponent(whatsAppMessage)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Launch WhatsApp Chat with {property.tel_mobile}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0 font-mono">
          <div>
            Last updated: {new Date(property.updated_at).toLocaleDateString('en-MY')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
