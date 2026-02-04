export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid: "Invalid password."
};

export default function AdminLoginPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const errorKey = typeof searchParams.error === "string" ? searchParams.error : "";
  const errorMessage = errorMessages[errorKey];

  return (
    <div>
      <h1>Admin login</h1>
      {errorMessage ? <div className="banner">{errorMessage}</div> : null}
      <form method="post">
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
