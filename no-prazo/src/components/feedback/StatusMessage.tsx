type StatusMessageProps = {
  tone?: "error" | "empty" | "info";
  title: string;
  description?: string;
};

export function StatusMessage({
  tone = "info",
  title,
  description,
}: StatusMessageProps) {
  return (
    <div className={`status-message ${tone}`} role={tone === "error" ? "alert" : "status"}>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
