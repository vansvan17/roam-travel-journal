import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  LoaderCircle,
  Map,
  Wallet,
} from "lucide-react";
import { request, today, covers, photo, uid, duration } from "../data.js";
import { Field } from "./ui.jsx";

export function AuthForm({ type, onSwitch, onSuccess, onDemo }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await onSuccess(
        await request(`/auth/${type}`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="modal-symbol">
        <Compass />
      </div>
      <div className="eyebrow">YOUR NEXT CHAPTER</div>
      <h2>
        {type === "register" ? "Start your story." : "Welcome back, wanderer."}
      </h2>
      <p className="muted">
        {type === "register"
          ? "A home for all the places you’ll go."
          : "Your little world is right where you left it."}
      </p>
      <form onSubmit={submit}>
        {type === "register" && (
          <Field label="Your name">
            <input
              name="name"
              required
              maxLength={80}
              autoComplete="name"
              placeholder="What should we call you?"
            />
          </Field>
        )}
        <Field label="Email address">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            name="password"
            minLength={10}
            maxLength={128}
            required
            autoComplete={
              type === "register" ? "new-password" : "current-password"
            }
            placeholder="At least 10 characters"
          />
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={18} /> : null}
          {busy
            ? "One moment…"
            : type === "register"
              ? "Create my account"
              : "Sign in"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="auth-switch">
        {type === "register" ? "Already have an account?" : "New around here?"}{" "}
        <button onClick={onSwitch}>
          {type === "register" ? "Sign in" : "Create an account"}
        </button>
      </p>
      <button className="demo-link" onClick={onDemo}>
        Just looking? Explore the browser-local demo <ArrowRight size={14} />
      </button>
    </>
  );
}

export function TripForm({ trip, busy, onSave, onCancel }) {
  const [cover, setCover] = useState(trip?.cover || "bali"),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (values.endDate < values.startDate) {
      setError("Choose an end date after your start date.");
      return;
    }
    try {
      await onSave(
        {
          ...trip,
          ...values,
          budget: Number(values.budget),
          cover,
          notes: values.notes || "",
          itinerary: trip?.itinerary || [],
          expenses: trip?.expenses || [],
          entries: trip?.entries || [],
        },
        !trip,
      );
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <div className="eyebrow">
        {trip ? "A LITTLE CHANGE OF PLANS" : "HERE’S TO YOUR NEXT CHAPTER"}
      </div>
      <h2>{trip ? "Make it your kind of trip." : "Where are we going?"}</h2>
      <p className="muted">Start with a place. The rest will follow.</p>
      <form onSubmit={submit}>
        <Field label="Give your trip a name">
          <input
            name="title"
            defaultValue={trip?.title}
            required
            maxLength={100}
            placeholder="A slower kind of Bali"
          />
        </Field>
        <div className="form-row">
          <Field label="City or region">
            <input
              name="destination"
              defaultValue={trip?.destination}
              required
              maxLength={120}
              placeholder="Ubud & Canggu"
            />
          </Field>
          <Field label="Country">
            <input
              name="country"
              defaultValue={trip?.country}
              required
              maxLength={80}
              placeholder="Indonesia"
            />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Start date">
            <input
              type="date"
              name="startDate"
              required
              defaultValue={trip?.startDate || today()}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              name="endDate"
              required
              defaultValue={trip?.endDate || today()}
            />
          </Field>
        </div>
        <div className="form-row thirds">
          <Field label="Budget">
            <input
              type="number"
              name="budget"
              defaultValue={trip?.budget ?? 0}
              min="0"
              max="100000000"
              step="0.01"
              required
            />
          </Field>
          <Field label="Currency">
            <select name="currency" defaultValue={trip?.currency || "INR"}>
              {["INR", "USD", "EUR", "GBP", "JPY"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={trip?.status || "Upcoming"}>
              {["Upcoming", "In progress", "Completed"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <fieldset className="cover-picker">
          <legend>Pick a feeling</legend>
          <div>
            {Object.entries(covers).map(([key, c]) => (
              <button
                key={key}
                type="button"
                aria-label={`Choose ${c.label} cover`}
                aria-pressed={cover === key}
                onClick={() => setCover(key)}
                style={{
                  backgroundImage: `linear-gradient(transparent,#0007),url(${photo(key, 200)})`,
                }}
                className={cover === key ? "chosen" : ""}
              >
                {cover === key && <Check size={16} />}
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <Field label="A little note (optional)">
          <textarea
            name="notes"
            defaultValue={trip?.notes}
            maxLength={5000}
            rows={2}
            placeholder="What are you looking forward to?"
          />
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : trip ? "Save changes" : "Create trip"}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </form>
    </>
  );
}

export function ItemForm({ type, trip, busy, onSave }) {
  const [error, setError] = useState("");
  const isStop = type === "stop",
    isExpense = type === "expense";
  async function submit(e) {
    e.preventDefault();
    setError("");
    const input = Object.fromEntries(new FormData(e.currentTarget));
    const item = { ...input, id: uid() };
    if (isStop) {
      item.day = Number(input.day);
      item.durationMinutes = Number(input.durationMinutes);
    }
    if (isExpense) item.amount = Number(input.amount);
    const key = isStop ? "itinerary" : isExpense ? "expenses" : "entries";
    try {
      await onSave({ ...trip, [key]: [...trip[key], item] });
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <div className="modal-symbol">
        {isStop ? <Map /> : isExpense ? <Wallet /> : <BookOpen />}
      </div>
      <div className="eyebrow">{trip.title}</div>
      <h2>
        {isStop
          ? "Add a little adventure."
          : isExpense
            ? "Keep the budget in view."
            : "Hold on to this moment."}
      </h2>
      <form onSubmit={submit}>
        <Field
          label={
            isStop
              ? "What’s the plan?"
              : isExpense
                ? "What did you spend on?"
                : "Give this memory a title"
          }
        >
          <input
            name="title"
            required
            maxLength={isExpense ? 120 : 160}
            placeholder={
              isStop
                ? "Sunrise at the rice terraces"
                : isExpense
                  ? "A really good cup of coffee"
                  : "The long way was the right way"
            }
          />
        </Field>
        {isStop ? (
          <>
            <div className="form-row">
              <Field label="Day of your trip">
                <input
                  type="number"
                  name="day"
                  required
                  defaultValue={1}
                  min={1}
                  max={duration(trip)}
                />
              </Field>
              <Field label="Time">
                <input type="time" name="time" defaultValue="09:00" required />
              </Field>
            </div>
            <Field label="Duration (minutes)">
              <input
                type="number"
                name="durationMinutes"
                min="5"
                max="720"
                step="5"
                defaultValue="60"
                required
              />
            </Field>
            <Field label="A little detail (optional)">
              <textarea
                name="notes"
                rows={3}
                maxLength={1000}
                placeholder="Bookings, directions, or a reminder to take it slow."
              />
            </Field>
          </>
        ) : isExpense ? (
          <>
            <div className="form-row">
              <Field label={`Amount (${trip.currency})`}>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  max="100000000"
                  required
                  placeholder="0.00"
                />
              </Field>
              <Field label="Category">
                <select name="category">
                  {["Stay", "Food", "Transport", "Activities", "Other"].map(
                    (c) => (
                      <option key={c}>{c}</option>
                    ),
                  )}
                </select>
              </Field>
            </div>
            <Field label="Date">
              <input type="date" name="date" required defaultValue={today()} />
            </Field>
          </>
        ) : (
          <>
            <div className="form-row">
              <Field label="Date">
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={today()}
                />
              </Field>
              <Field label="How did it feel?">
                <select name="mood">
                  {[
                    "Inspired",
                    "Happy",
                    "Grateful",
                    "Adventurous",
                    "Peaceful",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Tell your story">
              <textarea
                name="body"
                rows={6}
                required
                maxLength={10000}
                placeholder="What do you want to remember? The sounds, the people, the way you felt…"
              />
            </Field>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {busy
            ? "Saving…"
            : isStop
              ? "Add to itinerary"
              : isExpense
                ? "Save expense"
                : "Save this memory"}
          <Check size={17} />
        </button>
      </form>
    </>
  );
}
