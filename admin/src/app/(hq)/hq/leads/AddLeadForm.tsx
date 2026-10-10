import SubmitButton from '@/components/SubmitButton';
import { addLead } from './actions';

/** Add a lead by hand: someone met at an event, a referral, a WhatsApp message. It starts as New. */
export function AddLeadForm() {
  return (
    <form action={addLead} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div>
        <label className="label" htmlFor="lead-kind">What are they?</label>
        <select id="lead-kind" name="kind" className="input" defaultValue="gym">
          <option value="gym">Gym or club</option>
          <option value="company">Company</option>
          <option value="coach">Coach</option>
          <option value="venue">Restaurant or venue</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="lead-name">Business name</label>
        <input id="lead-name" name="business_name" required minLength={2} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="lead-contact">Contact name</label>
        <input id="lead-contact" name="contact_name" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="lead-email">Email</label>
        <input id="lead-email" name="email" type="email" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="lead-phone">Mobile / WhatsApp</label>
        <input id="lead-phone" name="phone" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="lead-city">City</label>
        <input id="lead-city" name="city" className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="lead-notes">Notes</label>
        <textarea id="lead-notes" name="notes" rows={2} placeholder="Where you met, what they need" className="input resize-y" />
      </div>
      <div className="self-end">
        <SubmitButton pendingLabel="Adding…" className="btn">Add lead</SubmitButton>
      </div>
    </form>
  );
}
