"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type Lead = {
  id: number;
  full_name: string;
  phone: string;
  reason: string;
  preferred_time: string | null;
  status: string;
  created_at: string;
};

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage(`Could not load leads: ${error.message}`);
      return;
    }

    setLeads(data ?? []);
  }

  async function updateLeadStatus(
    leadId: number,
    newStatus: string
  ) {
    setMessage("");

    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) {
      console.error(error);
      setMessage(`Could not update lead: ${error.message}`);
      return;
    }

    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === leadId
          ? { ...lead, status: newStatus }
          : lead
      )
    );

    setMessage("Lead status updated.");
  }

  async function deleteLead(leadId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmed) return;

    setMessage("");

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadId);

    if (error) {
      console.error(error);
      setMessage(`Could not delete lead: ${error.message}`);
      return;
    }

    setLeads((currentLeads) =>
      currentLeads.filter((lead) => lead.id !== leadId)
    );

    setMessage("Lead deleted.");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.from("leads").insert({
      full_name: fullName.trim(),
      phone: phone.trim(),
      reason: reason.trim(),
      preferred_time: preferredTime.trim() || null,
      status: "New",
    });

    if (error) {
      console.error(error);
      setMessage(`Could not create lead: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    setFullName("");
    setPhone("");
    setReason("");
    setPreferredTime("");
    setMessage("Lead saved successfully.");
    setIsSubmitting(false);

    await loadLeads();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Dental AI Receptionist
          </p>

          <h1 className="text-4xl font-bold">
            New-patient lead dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Patient inquiries are stored in Supabase.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-semibold">
              Simulate a patient inquiry
            </h2>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block font-medium">
                  Full name
                </span>

                <input
                  required
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 p-3"
                  placeholder="Jordan Smith"
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-medium">
                  Phone number
                </span>

                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 p-3"
                  placeholder="(562) 555-0123"
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-medium">
                  Reason for calling
                </span>

                <textarea
                  required
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  className="min-h-28 w-full rounded-lg border border-gray-300 p-3"
                  placeholder="Tooth pain and wants an appointment"
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-medium">
                  Preferred appointment time
                </span>

                <input
                  value={preferredTime}
                  onChange={(event) =>
                    setPreferredTime(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 p-3"
                  placeholder="Tuesday afternoon"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Saving..."
                  : "Create test lead"}
              </button>

              {message && (
                <p className="text-sm font-medium text-gray-700">
                  {message}
                </p>
              )}
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Incoming leads
              </h2>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                {leads.length} total
              </span>
            </div>

            {leads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                No leads yet. Submit the test form to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <article
                    key={lead.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {lead.full_name}
                        </h3>

                        <p className="text-sm text-gray-600">
                          {lead.phone}
                        </p>
                      </div>

                      <select
                        value={lead.status}
                        onChange={(event) =>
                          updateLeadStatus(
                            lead.id,
                            event.target.value
                          )
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">
                          Contacted
                        </option>
                        <option value="Booked">
                          Booked
                        </option>
                        <option value="Closed">
                          Closed
                        </option>
                      </select>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <strong>Reason:</strong> {lead.reason}
                      </p>

                      <p>
                        <strong>Preferred time:</strong>{" "}
                        {lead.preferred_time || "Not provided"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteLead(lead.id)}
                      className="mt-4 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete lead
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}