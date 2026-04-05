/* ─────────────────────────────────────────────
       <token-verification>
    ───────────────────────────────────────────── */
class TokenVerification extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this._state = store.getState();
    this._render();
  }

  _render() {
    const { user } = this._state;
    this.shadowRoot.innerHTML = `
      <style>
        
        :host { display: block; }
        .card {
          background: #fff; border: 1.5px solid #d4cfc4;
          border-radius: 8px; padding: 40px;
        }
        .card-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
        .card-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; color: #8a8070; margin-bottom: 32px;
        }
        .token-input-wrap { display: flex; gap: 12px; margin-bottom: 16px; }
        input[type="text"] {
          flex: 1; padding: 16px 20px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 28px; font-weight: 500;
          letter-spacing: 0.25em; text-align: center;
          border: 1.5px solid #d4cfc4; border-radius: 6px;
          outline: none; background: #f5f2eb; color: #0d0d0d;
          transition: border-color .2s;
        }
        input:focus { border-color: #0d0d0d; background: #fff; }
        input.error { border-color: #c84b2f; animation: shake .3s ease; }
        input.success { border-color: #2e7d52; background: #f0fff6; }
        @keyframes shake {
          0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}
        }
        .verify-btn {
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
          background: #0d0d0d; color: #f5f2eb;
          border: none; border-radius: 6px; padding: 16px 28px;
          cursor: pointer; white-space: nowrap;
          transition: background .2s;
        }
        .verify-btn:hover { background: #2a2a2a; }
        .msg {
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          padding: 10px 14px; border-radius: 6px; display: none;
        }
        .msg.show { display: block; }
        .msg.err { background: #fff0ee; color: #c84b2f; }
        .msg.ok { background: #edfff5; color: #2e7d52; }
        .btn-back {
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
          background: none; border: 1.5px solid #d4cfc4;
          border-radius: 6px; padding: 12px 20px;
          cursor: pointer; color: #8a8070; margin-top: 12px;
          transition: border-color .2s, color .2s; display: inline-block;
        }
        .btn-back:hover { border-color: #0d0d0d; color: #0d0d0d; }
        .hint {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          color: #8a8070; margin-top: 20px;
          padding: 12px 16px; background: #f5f2eb; border-radius: 6px;
        }
      </style>
      <div class="card">
        <div class="card-title">Verify Email</div>
        <div class="card-sub">// Token sent to ${user.email || "your email"} — check the console</div>
        <div class="token-input-wrap">
          <input type="text" id="token-input" />
          <button class="verify-btn" id="verify-btn">Verify</button>
        </div>
        <div class="msg" id="msg"></div>
        <div class="hint">Tip: The token was printed in your browser console (F12)</div>
        <br/>
        <button class="btn-back" id="back-btn">← Back</button>
      </div>
    `;

    const shadow = this.shadowRoot;
    const input = shadow.getElementById("token-input");
    const msg = shadow.getElementById("msg");

    // Only allow digits
    // input.addEventListener("input", () => {
    //   input.value = input.value.replace(/\D/g, "");
    // });

    shadow.getElementById("verify-btn").addEventListener("click", async () => {
      const entered = input.value.trim();
      const stored = store.getState().token;
      msg.className = "msg";

      let res = await (
        await fetch("/api/auth/passwordless/register/confirm_link/" + entered)
      ).json();
      if (res) {
        input.classList.add("success");
        msg.textContent = "✓ Token verified! Redirecting to payment…";
        msg.classList.add("msg", "show", "ok");
        setTimeout(() => store.setStep("payment"), 900);
      } else {
        input.classList.add("error");
        msg.textContent = "✗ Invalid token. Please try again.";
        msg.classList.add("msg", "show", "err");
        setTimeout(() => input.classList.remove("error"), 400);
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") shadow.getElementById("verify-btn").click();
    });

    shadow
      .getElementById("back-btn")
      .addEventListener("click", () => store.setStep("form"));
  }
}
customElements.define("token-verification", TokenVerification);
