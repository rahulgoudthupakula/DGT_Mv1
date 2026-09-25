import { useEffect, useRef, useState, type FormEvent } from "react";
import { request } from "@/lib/backend";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Field = "firstName" | "lastName" | "email" | "phone" | "businessName" | "storeName" | "storeCode";
const personalFields: Field[] = ["firstName", "lastName", "email", "phone"];
const companyFields: Field[] = ["businessName", "storeName", "storeCode"];
const initialValues: Record<Field, string> = { firstName: "", lastName: "", email: "", phone: "", businessName: "", storeName: "", storeCode: "" };
const labels: Record<Field, string> = { firstName: "First name", lastName: "Last name", email: "Email", phone: "Phone number", businessName: "Legal business / LLC name", storeName: "Store name", storeCode: "Store ID / Location Code" };
const autocomplete: Partial<Record<Field, string>> = { firstName: "given-name", lastName: "family-name", email: "email", phone: "tel", businessName: "organization" };

export function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [reviewed, setReviewed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);

  function validate(field: Field) {
    const value = values[field];
    if (!value.trim()) return `${labels[field]} is required.`;
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address.";
    if (field === "phone" && (!/^\+?[\d\s().-]+$/.test(value.trim()) || value.replace(/\D/g, "").length < 7 || value.replace(/\D/g, "").length > 15)) return "Enter a valid phone number with 7–15 digits, including the country code if needed.";
    return undefined;
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const fields = step === 1 ? personalFields : [...personalFields, ...companyFields];
    const next: Partial<Record<Field, string>> = {};
    fields.forEach(field => { const message = validate(field); if (message) next[field] = message; });
    setErrors(next);
    const first = fields.find(field => next[field]);
    if (first) { form.current?.querySelector<HTMLInputElement>(`#signup-${first}`)?.focus(); return; }
    if (step === 1) { setStep(2); setReviewed(false); }
    else {
      setBusy(true); setFailure("");
      try { await request("/signup-requests", {method: "POST", body: JSON.stringify(values)}); setReviewed(true); }
      catch (error) { setFailure(error instanceof Error ? error.message : "Unable to submit. Please try again."); }
      finally { setBusy(false); }
    }
  }
  function input(field: Field) {
    const type = field === "email" ? "email" : field === "phone" ? "tel" : "text";
    const hint = field === "storeCode" ? "Your existing location code—not the internal ID assigned by DGT." : undefined;
    return <div key={field} className="space-y-1.5">
      <Label htmlFor={`signup-${field}`}>{labels[field]}</Label>
      <div className="relative">
        <Input id={`signup-${field}`} name={field} type={type} required autoComplete={autocomplete[field] ?? "off"}
          value={values[field]} disabled={busy} maxLength={field === "email" ? 254 : field === "phone" ? 40 : field === "businessName" ? 200 : field === "storeName" ? 150 : field === "storeCode" ? 50 : 100}
          placeholder={field === "email" ? "you@example.com" : field === "phone" ? "+1 (555) 123-4567" : undefined}
          aria-invalid={!!errors[field]} aria-describedby={[hint && `hint-${field}`, errors[field] && `error-${field}`].filter(Boolean).join(" ") || undefined}
          onChange={event => { setValues(old => ({ ...old, [field]: event.target.value })); setErrors(old => ({ ...old, [field]: undefined })); setReviewed(false); }}
          onBlur={() => setErrors(old => ({ ...old, [field]: validate(field) }))} />
      </div>
      {hint && <p id={`hint-${field}`} className="text-xs text-muted-foreground">{hint}</p>}
      {errors[field] && <p id={`error-${field}`} role="alert" className="text-xs text-destructive">{errors[field]}</p>}
    </div>;
  }
  return <main className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3"><Store className="w-6 h-6 text-primary" aria-hidden="true" /></div>
        <CardTitle className="text-xl">DGT Project</CardTitle>
        <p className="text-sm text-muted-foreground">Request an account</p>
        <ol aria-label="Signup progress" className="flex justify-center gap-4 pt-3 text-sm">
          <li aria-current={step === 1 ? "step" : undefined} className={step === 1 ? "text-primary font-semibold" : "text-muted-foreground"}>1. Your details</li>
          <li aria-current={step === 2 ? "step" : undefined} className={step === 2 ? "text-primary font-semibold" : "text-muted-foreground"}>2. Company &amp; store</li>
        </ol>
      </CardHeader>
      <CardContent className="space-y-5">
        {!reviewed && <h1 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">{step === 1 ? "Your details" : "Company and store"}</h1>}
        {reviewed ? <div role="status" className="rounded-md border bg-primary/5 p-5 space-y-2"><h1 className="text-lg font-semibold">Your request is under review</h1><p className="text-sm">After verification, you will receive your login credentials at the email address you provided.</p></div> : <form ref={form} noValidate onSubmit={submit} className="space-y-4">
          {step === 1 ? <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{input("firstName")}{input("lastName")}</div>
            {personalFields.slice(2).map(input)}
          </> : <>
            {companyFields.map(input)}
          </>}
          {failure && <p role="alert" className="text-sm text-destructive">{failure}</p>}
          <div className="flex gap-3 pt-2">
            {step === 2 && <Button type="button" disabled={busy} variant="outline" onClick={() => { setStep(1); setErrors({}); setReviewed(false); }}>Back</Button>}
            <Button type="submit" disabled={busy} className="flex-1">{busy ? "Submitting…" : step === 1 ? "Next" : "Sign up"}</Button>
          </div>
        </form>}
        <p className="text-center text-sm text-muted-foreground">Already have an account? <Link className="text-primary font-medium underline-offset-4 hover:underline focus-visible:underline" to="/login">Sign in</Link></p>
      </CardContent>
    </Card>
  </main>;
}
