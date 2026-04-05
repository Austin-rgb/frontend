/* ─────────────────────────────────────────────
       <user-form>
    ───────────────────────────────────────────── */
class UserForm extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        
        :host { display: block; }
        .card {
          background: #fff;
          border: 1.5px solid #d4cfc4;
          border-radius: 8px;
          padding: 40px;
        }
        .card-title {
          font-size: 24px; font-weight: 800;
          letter-spacing: -0.02em; margin-bottom: 6px;
        }
        .card-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; color: #8a8070;
          margin-bottom: 32px;
        }
        .field { margin-bottom: 24px; }
        label {
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #8a8070; margin-bottom: 8px;
        }
        input[type="text"], input[type="email"] {
          width: 100%; padding: 12px 16px;
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 600;
          border: 1.5px solid #d4cfc4;
          border-radius: 6px; outline: none;
          background: #f5f2eb; color: #0d0d0d;
          transition: border-color .2s, background .2s;
        }
        input:focus { border-color: #0d0d0d; background: #fff; }
        input.error { border-color: #c84b2f; }
        .err-msg {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #c84b2f;
          margin-top: 6px; display: none;
        }
        .err-msg.show { display: block; }
        .actions { display: flex; gap: 12px; margin-top: 8px; }
        .btn-back {
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 600;
          background: none; border: 1.5px solid #d4cfc4;
          border-radius: 6px; padding: 14px 24px;
          cursor: pointer; color: #8a8070;
          transition: border-color .2s, color .2s;
        }
        .btn-back:hover { border-color: #0d0d0d; color: #0d0d0d; }
        .btn-submit {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700;
          background: #0d0d0d; color: #f5f2eb;
          border: none; border-radius: 6px;
          padding: 14px 32px; cursor: pointer; flex: 1;
          transition: background .2s;
        }
        .btn-submit:hover { background: #2a2a2a; }
        .loading { opacity: 0.6; pointer-events: none; }
        .token-note {
          margin-top: 20px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #8a8070;
          background: #f5f2eb; border-radius: 6px;
          padding: 12px 16px; display: none;
        }
        .token-note.show { display: block; }
        .token-val {
          font-size: 20px; font-weight: 500;
          color: #0d0d0d; letter-spacing: 0.15em;
          margin-top: 6px;
        }
      </style>
      <div class="card">
        <div class="card-title">Your Details</div>
        <div class="card-sub">// We'll send a verification token to your email</div>
        <div class="field">
          <label for="name">Full Name</label>
          <input type="text" id="name" placeholder="Jane Doe" />
          <div class="err-msg" id="name-err">Name is required</div>
        </div>
        <div class="field">
          <label for="email">Email Address</label>
          <input type="email" id="email" placeholder="jane@example.com" />
          <div class="err-msg" id="email-err">Enter a valid email address</div>
        </div>
        <div class="actions">
          <button class="btn-back" id="back-btn">← Back</button>
          <button class="btn-submit" id="submit-btn">Send Token →</button>
        </div>
        <div class="token-note" id="token-note">
          <div>Token sent! Check your console. Your token:</div>
          <div class="token-val" id="token-display"></div>
        </div>
      </div>
    `;

    const shadow = this.shadowRoot;
    shadow
      .getElementById("back-btn")
      .addEventListener("click", () => store.setStep("cart"));

    shadow.getElementById("submit-btn").addEventListener("click", () => {
      const nameEl = shadow.getElementById("name");
      const emailEl = shadow.getElementById("email");
      const nameErr = shadow.getElementById("name-err");
      const emailErr = shadow.getElementById("email-err");
      let valid = true;

      nameEl.classList.remove("error");
      nameErr.classList.remove("show");
      emailEl.classList.remove("error");
      emailErr.classList.remove("show");

      if (!nameEl.value.trim()) {
        nameEl.classList.add("error");
        nameErr.classList.add("show");
        valid = false;
      }
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(emailEl.value.trim())) {
        emailEl.classList.add("error");
        emailErr.classList.add("show");
        valid = false;
      }

      if (!valid) return;

      const token = randomToken();
      store.setToken(token);
      store.setUser({ name: nameEl.value.trim(), email: emailEl.value.trim() });
      console.log(
        `%c[Checkout] Verification token for ${emailEl.value.trim()}: ${token}`,
        "color: #c84b2f; font-weight: bold; font-size: 14px;",
      );

      // Show token note (simulated "email")
      const note = shadow.getElementById("token-note");
      const disp = shadow.getElementById("token-display");
      disp.textContent = token;
      note.classList.add("show");

      // Navigate after brief delay
      setTimeout(() => store.setStep("verify"), 1200);
    });
  }
}
customElements.define("user-form", UserForm);
