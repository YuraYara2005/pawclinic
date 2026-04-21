const variants = {
  scheduled: "bg-sky-100 text-sky-600",
  completed: "bg-mint-100 text-primary",
  cancelled: "bg-rose-100 text-rose-500",
  "no-show": "bg-beige-100 text-accent",
  pending: "bg-beige-100 text-accent",
  paid: "bg-mint-100 text-primary",
  partial: "bg-sky-100 text-sky-600",
  admin: "bg-rose-100 text-rose-500",
  vet: "bg-mint-100 text-primary",
  receptionist: "bg-beige-100 text-accent",
  low: "bg-rose-100 text-rose-500",
  ok: "bg-mint-100 text-primary",
};

export default function Badge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${variants[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}
