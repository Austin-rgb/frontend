class TextField extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  attributeChangedCallback() {
    this._render();
  }
  connectedCallback() {
    this._render();
  }
  _render() {
    this.shadowRoot.innerHTML = `
        <input id="${this.getAttribute(
          "f-id",
        )}" placeholder="${this.getAttribute("f-name")}"  required><br>
        `;
  }
}

class PasswordField extends TextField {
  _render() {
    this.shadowRoot.innerHTML = `
            <input id="${this.getAttribute(
              "f-id",
            )}" type="password" placeholder="${this.getAttribute(
              "f-name",
            )}" required><br>
            `;
  }
}

customElements.define("text-field", TextField);
customElements.define("password-field", PasswordField);

class LoginForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  attributeChangedCallback() {
    this._render();
  }
  connectedCallback() {
    this._render();
    let form = this.shadowRoot.getElementById("auth-form");

    form.addEventListener("submit", this.handleSubmit);
  }
  _render() {
    this.shadowRoot.innerHTML = `
    <style>
      :host {
        display: block;
      }
      form {
        display: grid;
        gap: 12px;
      }
      input {
        width: 100%;
        border: 1px solid #c6d3e2;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 16px;
        background: #f8fbff;
      }
      input:focus {
        outline: 2px solid #8cb5ea;
        outline-offset: 1px;
        border-color: #8cb5ea;
        background: #fff;
      }
      button {
        border: 0;
        border-radius: 12px;
        min-height: 44px;
        padding: 10px 16px;
        color: #fff;
        font-size: 0.98rem;
        font-weight: 600;
        cursor: pointer;
        background: linear-gradient(135deg, #0f63b4, #2994d6);
      }
      button:hover {
        filter: brightness(1.03);
      }
    </style>
    <form id="auth-form">
        <input id="username" placeholder="Username" autocomplete="username" required>
        <input id="password" type="password" placeholder="Password" autocomplete="current-password" required>
        <button type="submit">Login</button>
    </form>
    `;
  }

  handleSubmit = (event) => {
    event.preventDefault();
    let username = this.shadowRoot.querySelector("#username").value;
    let password = this.shadowRoot.getElementById("password").value;
    const fname = this.getAttribute("on-login");
    if (fname) {
      window[fname]({ username, password });
    } else {
      console.log(fname);
    }
  };
}

customElements.define("login-form", LoginForm);

class RegisterForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  attributeChangedCallback() {
    this._render();
  }
  connectedCallback() {
    this._render();
    let form = this.shadowRoot.getElementById("auth-form");

    form.addEventListener("submit", this.handleSubmit);
  }
  _render() {
    this.shadowRoot.innerHTML = `
    <style>
      :host {
        display: block;
      }
      form {
        display: grid;
        gap: 12px;
      }
      input {
        width: 100%;
        border: 1px solid #c6d3e2;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 16px;
        background: #f8fbff;
      }
      input:focus {
        outline: 2px solid #7cc0a7;
        outline-offset: 1px;
        border-color: #7cc0a7;
        background: #fff;
      }
      button {
        border: 0;
        border-radius: 12px;
        min-height: 44px;
        padding: 10px 16px;
        color: #fff;
        font-size: 0.98rem;
        font-weight: 600;
        cursor: pointer;
        background: linear-gradient(135deg, #0f9268, #22b991);
      }
      button:hover {
        filter: brightness(1.03);
      }
    </style>
    <form id="auth-form">
        <input data-cy="login-user" id="username" placeholder="Username" autocomplete="username" required>
        <input data-cy="login-pass" id="password" type="password" placeholder="Password" autocomplete="new-password" required>
        <button type="submit">Register</button>
    </form>
    `;
  }

  handleSubmit = (event) => {
    event.preventDefault();
    let username = this.shadowRoot.querySelector("#username").value;
    let password = this.shadowRoot.getElementById("password").value;
    const fname = this.getAttribute("on-register");
    if (fname) {
      window[fname]({ username, password });
    } else {
      console.log(fname);
    }
  };
}

customElements.define("register-form", RegisterForm);
