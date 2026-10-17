import type { Account } from "../data/accounts";
import type { DayStop } from "../domain/repDay";

interface NextBusinessCardProps {
  account: Account;
  stop?: DayStop;
  onNavigate: () => void;
}

export function NextBusinessCard({ account, stop, onNavigate }: NextBusinessCardProps) {
  const commitment = stop?.hardCommitment || stop?.schedule?.kind === "hard_appointment";
  const label = commitment ? "APPOINTMENT" : stop?.schedule ? "CALLBACK WINDOW" : "NEXT BEST BUSINESS";
  return (
    <section className="next-business-card" aria-label={`Next best business: ${account.name}`}>
      <div className="next-business-card__topline">
        <span>{label}</span>
        <button className="next-business-card__more" aria-label={`More options for ${account.name}`}>•••</button>
      </div>
      <div className="next-business-card__identity">
        <span className="next-business-card__icon" aria-hidden="true">▦</span>
        <div>
          <h2>{account.name}</h2>
          <p>{account.address}</p>
        </div>
      </div>
      <div className="next-business-card__meta">
        <div><span className="meta-icon" aria-hidden="true">◫</span><span><small>{commitment ? "Appointment" : "Next action"}</small><strong>{stop?.scheduledTime ?? "Now"}</strong></span></div>
        <div><span className="meta-icon" aria-hidden="true">◷</span><span><small>Est. arrival</small><strong>{stop ? `${stop.travelMinutes} min` : "Nearby"}</strong></span></div>
      </div>
      <button className="next-business-card__navigate" onClick={onNavigate}><span aria-hidden="true">➤</span> Navigate</button>
    </section>
  );
}
