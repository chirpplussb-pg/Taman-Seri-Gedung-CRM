/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Property, InteractionChannel, InteractionOutcome, RelationshipType, TracingStatus } from '../types/property';
import { PropertyStorageService } from '../services/propertyStorage';
import { X, PhoneCall, Check, Calendar, User, Phone, FileText, AlertCircle } from 'lucide-react';

interface InteractionLogModalProps {
  property?: Property | null;
  allProperties: Property[];
  onClose: () => void;
  onInteractionAdded: (property: Property | null) => void;
}

export const InteractionLogModal: React.FC<InteractionLogModalProps> = ({
  property,
  allProperties,
  onClose,
  onInteractionAdded,
}) => {
  const [selectedHouseNo, setSelectedHouseNo] = useState(property ? property.house_no : '376');
  const [partyContacted, setPartyContacted] = useState(property ? property.buyer_primary : '');
  const [relationship, setRelationship] = useState<RelationshipType>('Original Buyer');
  const [phoneDialed, setPhoneDialed] = useState(property?.tel_mobile || '');
  const [channel, setChannel] = useState<InteractionChannel>('Phone Call');
  const [outcome, setOutcome] = useState<InteractionOutcome>('Follow-up Required');
  const [detailedNotes, setDetailedNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [newTracingStatus, setNewTracingStatus] = useState<TracingStatus>(
    property ? property.tracing_status : 'Contact Established'
  );
  const [docLink, setDocLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // When house changes, update defaults
  const handleHouseChange = (newHouseNo: string) => {
    setSelectedHouseNo(newHouseNo);
    const found = allProperties.find(p => p.house_no === newHouseNo);
    if (found) {
      setPartyContacted(found.buyer_primary);
      setPhoneDialed(found.tel_mobile || '');
      setNewTracingStatus(found.tracing_status);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyContacted.trim()) {
      setErrorMsg('Please specify the party contacted.');
      return;
    }
    if (!detailedNotes.trim()) {
      setErrorMsg('Please enter detailed notes from the conversation.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const targetProp = allProperties.find(p => p.house_no === selectedHouseNo);
    const propId = targetProp ? targetProp.id : `prop-${selectedHouseNo.padStart(4, '0')}`;

    const docs = docLink.trim() ? [docLink.trim()] : [];

    const { property: updatedProp } = PropertyStorageService.addInteractionLog(
      {
        property_id: propId,
        house_no: selectedHouseNo,
        interaction_timestamp: new Date().toISOString(),
        party_contacted: partyContacted.trim(),
        relationship,
        phone_dialed: phoneDialed.trim() || null,
        channel,
        outcome,
        detailed_notes: detailedNotes.trim(),
        next_follow_up_date: nextFollowUpDate || null,
        docs_collected_urls: docs,
        recorded_by: 'Mirra Lakeside (Field CRM)',
      },
      newTracingStatus
    );

    setIsSubmitting(false);
    onInteractionAdded(updatedProp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Log Owner Outreach Touchpoint</h2>
              <p className="text-xs text-slate-400">Record calls, visits, WhatsApp, or legal correspondence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Property Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Target Property (House No)
            </label>
            <select
              value={selectedHouseNo}
              onChange={(e) => handleHouseChange(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {allProperties.map((p) => (
                <option key={p.id} value={p.house_no}>
                  Unit #{p.house_no} - {p.street_name} ({p.buyer_primary})
                </option>
              ))}
            </select>
          </div>

          {/* Party Contacted & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Party Contacted *
              </label>
              <input
                type="text"
                required
                value={partyContacted}
                onChange={(e) => setPartyContacted(e.target.value)}
                placeholder="e.g. Usha a/p Muthusamy, En. Azman"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Relationship to Property
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Original Buyer">Original 1988 Buyer</option>
                <option value="Waris (Child)">Waris (Child / Anak)</option>
                <option value="Waris (Spouse)">Waris (Spouse / Pasangan)</option>
                <option value="Waris (Sibling)">Waris (Sibling / Adik-Beradik)</option>
                <option value="Pentadbir">Pentadbir (Administrator / Executor)</option>
                <option value="Peguam">Peguam (Lawyer / Legal Counsel)</option>
                <option value="Neighbor">Neighbor / Jiran</option>
                <option value="Tenant">Current Tenant</option>
                <option value="Other">Other Representative</option>
              </select>
            </div>
          </div>

          {/* Channel & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Communication Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as InteractionChannel)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Phone Call">Phone Call</option>
                <option value="WhatsApp">WhatsApp Message</option>
                <option value="Physical Visit">Physical Site Visit</option>
                <option value="Official Notice">Official Notice / Pos Berdaftar</option>
                <option value="Legal Letter">Legal Letter (Panel Lawyer)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number Dialed
              </label>
              <input
                type="text"
                value={phoneDialed}
                onChange={(e) => setPhoneDialed(e.target.value)}
                placeholder="e.g. 012-4829104"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Outcome & Resulting Tracing Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Interaction Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => {
                  const val = e.target.value as InteractionOutcome;
                  setOutcome(val);
                  if (val === 'Agreed to Borang 14A') setNewTracingStatus('Negotiating Transfer');
                  else if (val === 'Documents Collected') setNewTracingStatus('Completed');
                  else if (val === 'Wrong Number' || val === 'Refused') setNewTracingStatus('Untraceable');
                  else if (val === 'Follow-up Required') setNewTracingStatus('Follow-up Required');
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Follow-up Required">Follow-up Required</option>
                <option value="Agreed to Borang 14A">Agreed to Borang 14A Transfer</option>
                <option value="Documents Collected">Documents Collected</option>
                <option value="No Answer">No Answer / Unreachable</option>
                <option value="Wrong Number">Wrong Number / Disconnected</option>
                <option value="Refused">Refused Cooperation</option>
                <option value="Dispute">Family Dispute / Litigation</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Update Parent Property Tracing Status To
              </label>
              <select
                value={newTracingStatus}
                onChange={(e) => setNewTracingStatus(e.target.value as TracingStatus)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Pending Outreach">Pending Outreach</option>
                <option value="Contact Established">Contact Established</option>
                <option value="Follow-up Required">Follow-up Required</option>
                <option value="Negotiating Transfer">Negotiating Transfer</option>
                <option value="Untraceable">Untraceable</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Detailed Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Detailed Notes & Action Points *
            </label>
            <textarea
              required
              rows={4}
              value={detailedNotes}
              onChange={(e) => setDetailedNotes(e.target.value)}
              placeholder="Summary of discussion: buyer status, willingness to sign Borang 14A, probate progress, dispute details, or objections..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
            />
          </div>

          {/* Next Follow-up Date & Document attachment URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Next Follow-up Date (Optional)
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Collected Doc URL (Google Drive / Cloud)
              </label>
              <input
                type="url"
                value={docLink}
                onChange={(e) => setDocLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Outreach Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
