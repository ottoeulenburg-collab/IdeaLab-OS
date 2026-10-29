import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { initials } from "../utils.js";

const paths = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1Z" />
    </>
  ),
  board: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v12M15 15h6" />
    </>
  ),
  equipment: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v10l9 5 9-5V8M12 13v10M7.5 5.5l9 5" />
    </>
  ),
  qr: (
    <>
      <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6zM21 12h-3M12 3v3M12 12h3M12 18v3" />
    </>
  ),
  print: (
    <>
      <path d="M6 9V3h12v6M6 18H3v-9h18v9h-3M6 14h12v7H6zM17 12h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 11h18M7 3v4M17 3v4" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      <circle cx="9" cy="7" r="4" />
    </>
  ),
  budget: (
    <>
      <rect x="3" y="14" width="4" height="7" rx="1" />
      <rect x="10" y="9" width="4" height="12" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  edit: (
    <>
      <path d="m16 3 5 5-12 12-6 1 1-6Z M14 5l5 5" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="m16 16 5 5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" />
    </>
  ),
  alert: (
    <>
      <path d="m12 3 10 18H2Z M12 9v4M12 17h.01" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
  phone: (
    <path d="m5 3 4 1 1 5-3 2a15 15 0 0 0 6 6l2-3 5 1 1 4c-1 4-7 3-12-2S1 4 5 3Z" />
  ),
  save: (
    <>
      <path d="M5 3h12l4 4v14H3V3h2Z M7 3v6h9V3M7 21v-8h10v8" />
    </>
  ),
};
export function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.calendar}
    </svg>
  );
}
export function Button({
  children,
  icon,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </button>
  );
}
export function IconButton({ icon, label, ...props }) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}
export function Badge({ children, tone = "" }) {
  return (
    <span
      className={`badge ${tone || String(children).toLowerCase().replaceAll(" ", "-")}`}
    >
      {children}
    </span>
  );
}
export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Field({ label, children, className = "", hint }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <Icon name="calendar" size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Avatars({ ids, people, limit = 3 }) {
  const persons = ids
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean);
  return (
    <div className="avatars" aria-label={persons.map((p) => p.name).join(", ")}>
      {persons.slice(0, limit).map((p, i) => (
        <span className={`avatar color-${i % 4}`} key={p.id} title={p.name}>
          {initials(p.name)}
        </span>
      ))}
      {persons.length > limit ? (
        <span className="avatar color-3">+{persons.length - limit}</span>
      ) : null}
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const titleId = useId();
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    const focusable = () =>
      [
        ...dialog.querySelectorAll("button, input, select, textarea, a[href]"),
      ].filter((el) => !el.disabled && el.getClientRects().length);
    const first = dialog.querySelector("[data-autofocus]") || focusable()[0];
    first?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function keydown(e) {
      if ([...document.querySelectorAll('[role="dialog"]')].at(-1) !== dialog)
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const all = focusable(),
          firstEl = all[0],
          last = all.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === firstEl ||
            !dialog.contains(document.activeElement))
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            !dialog.contains(document.activeElement))
        ) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <header>
          <h2 id={titleId}>{title}</h2>
          <IconButton icon="close" label="Dialog schließen" onClick={onClose} />
        </header>
        {children}
      </section>
    </div>
  );
}
export function FormActions({ onClose, children = "Speichern" }) {
  return (
    <div className="form-actions">
      <Button type="button" variant="secondary" onClick={onClose}>
        Abbrechen
      </Button>
      <Button type="submit" icon="check">
        {children}
      </Button>
    </div>
  );
}

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const ask = (message) =>
    new Promise((resolve) => setRequest({ message, resolve }));
  function finish(result) {
    request.resolve(result);
    setRequest(null);
  }
  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {request ? (
        <Modal title="Änderung bestätigen" onClose={() => finish(false)}>
          <p className="confirm-message">{request.message}</p>
          <div className="form-actions">
            <Button
              data-autofocus
              variant="secondary"
              onClick={() => finish(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={() => finish(true)}>Bestätigen</Button>
          </div>
        </Modal>
      ) : null}
    </ConfirmContext.Provider>
  );
}
