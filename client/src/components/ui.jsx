import React, { useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  MapPin,
  Plane,
  Trash2,
  X,
} from "lucide-react";
import { covers, photo, dateLabel, duration } from "../data.js";

export function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
      <span className="stat-icon">
        <Icon size={22} />
      </span>
    </div>
  );
}

export function TripCard({ trip: t, onOpen }) {
  return (
    <button className="trip-card" onClick={onOpen}>
      <div
        className="card-photo"
        style={{
          backgroundImage: `url(${photo(t.cover, 700)})`,
          backgroundColor: covers[t.cover].color,
        }}
      >
        <span className={`status ${t.status.replace(" ", "-").toLowerCase()}`}>
          <span />
          {t.status}
        </span>
        <span className="card-open">
          <ArrowUpRight size={17} />
        </span>
      </div>
      <div className="card-body">
        <span className="card-location">
          <MapPin size={13} />
          {t.destination}, {t.country}
        </span>
        <h3>{t.title}</h3>
        <div className="card-dates">
          <CalendarDays size={14} />
          {dateLabel(t.startDate)} – {dateLabel(t.endDate, { year: "numeric" })}
          <span>{duration(t)} days</span>
        </div>
        <div className="card-bottom">
          <span>
            {t.entries.length ? (
              <>
                <BookOpen size={13} />
                {t.entries.length}{" "}
                {t.entries.length === 1 ? "memory" : "memories"} saved
              </>
            ) : (
              <>
                <Plane size={13} />A little escape awaits
              </>
            )}
          </span>
          <ArrowRight size={16} />
        </div>
      </div>
    </button>
  );
}

export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="empty">
      <Icon size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}

export function Modal({ children, onClose, wide }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = ref.current.querySelectorAll(
          'button:not(:disabled),input,select,textarea,[tabindex="0"]',
        );
        const first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = scroll;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        tabIndex={-1}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Roam dialog"
      >
        <button
          className="modal-close icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        {children}
      </section>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function RemoveButton({ id, removing, setRemoving, busy, onRemove }) {
  return removing === id ? (
    <span className="remove-confirm">
      <button
        disabled={busy}
        aria-label="Confirm remove item"
        onClick={onRemove}
      >
        Remove
      </button>
      <button
        aria-label="Cancel removing item"
        onClick={() => setRemoving(null)}
      >
        <X size={14} />
      </button>
    </span>
  ) : (
    <button
      className="remove-item"
      disabled={busy}
      aria-label="Remove item"
      onClick={() => setRemoving(id)}
    >
      <Trash2 size={15} />
    </button>
  );
}
