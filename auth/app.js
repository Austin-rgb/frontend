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
    let form = this.shadowRoot.getElementById("login-form");

    form.addEventListener("submit", this.handleSubmit);
  }
  _render() {
    this.shadowRoot.innerHTML = `
    <form id="login-form">
        <input id="username" placeholder="Username"><br>
        <input id="password" type="password" placeholder="Password"><br>
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
    let form = this.shadowRoot.getElementById("login-form");

    form.addEventListener("submit", this.handleSubmit);
  }
  _render() {
    this.shadowRoot.innerHTML = `
    <form id="login-form">
        <input id="username" placeholder="Username"><br>
        <input id="password" type="password" placeholder="Password"><br>
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
