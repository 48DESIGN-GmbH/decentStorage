import { StorageProvider } from "../StorageProvider.js";

import { parseQueryString } from "../utils.js";
import { Dropbox, DropboxAuth } from "dropbox";

class DropboxStorageProvider extends StorageProvider {
  name = "Dropbox";

  #dbx;
  #dbxAuth;

  #REDIRECT_URI = window.location.href.substring(
    0,
    window.location.href.indexOf(window.location.search) ||
      window.location.href.length
  );

  constructor(decentStorageInstance, options) {
    super(decentStorageInstance, options);

    if (!options.clientId) {
      throw new Error(
        `clientId is a required option for ${this.constructor.name}`
      );
    }

    this.#dbxAuth = new DropboxAuth({
      clientId: options.clientId,
    });
  }

  auth() {
    this.#dbxAuth
      .getAuthenticationUrl(
        this.#REDIRECT_URI,
        undefined,
        "code",
        "offline",
        undefined,
        undefined,
        true
      )
      .then((authUrl) => {
        this.dS.sessionStore.setItem(
          "dropbox.codeVerifier",
          this.#dbxAuth.codeVerifier
        );
        window.location.href = authUrl;
      })
      .catch((error) => console.error(error));
  }

  async handleAuth() {
    const codeVerifier = this.dS.sessionStore.getItem("dropbox.codeVerifier");
    let dbxAccessToken = this.dS.authStore.getItem("dropbox.access_token");
    let dbxRefreshToken = this.dS.authStore.getItem("dropbox.refresh_token");

    if (this.hasRedirectedFromAuth()) {
      const code = this.getCodeFromUrl();
      window.history.replaceState({}, "", this.#REDIRECT_URI);
      if (!codeVerifier) {
        return;
      }

      // @TODO: set authed flag
      this.#dbxAuth.setCodeVerifier(codeVerifier);
      await this.#dbxAuth
        .getAccessTokenFromCode(this.#REDIRECT_URI, code)
        .then((response) => {
          this.dS.sessionStore.removeItem("dropbox.codeVerifier");
          dbxAccessToken = response.result.access_token;
          dbxRefreshToken = response.result.refresh_token;
          this.dS.authStore.setItem("dropbox.access_token", dbxAccessToken);
          this.dS.authStore.setItem("dropbox.refresh_token", dbxRefreshToken);
        })
        .catch((error) => {
          console.error(error);
        });
    } else if (dbxAccessToken) {
      this.#dbxAuth.setAccessToken(dbxAccessToken);
      this.#dbx = new Dropbox({
        auth: this.#dbxAuth,
      });

      this.#dbx
        .filesListFolder({
          path: "",
        })
        .then((response) => {
          console.log(response.result.entries);
        })
        .catch((response) => {
          if (response.status === 401) {
            this.#dbxAuth.setRefreshToken(dbxRefreshToken);
            this.#dbx
              .filesListFolder({
                path: "",
              })
              .then((response) => {
                this.dS.authStore.setItem(
                  "dropbox.access_token",
                  this.#dbxAuth.getAccessToken()
                );
                console.info("Dropbox access token has been refreshed");
                this.#dbxAuth.setRefreshToken(undefined);
                console.log(response.result.entries);
              });
          } else {
            throw response;
          }
        });
      // @TODO: set authed flag
    } else {
      // @TODO: unset authed flag
    }
  }

  // Parses the url and gets the access token if it is in the urls hash
  getCodeFromUrl() {
    return parseQueryString(window.location.search).code;
  }

  // If the user was just redirected from authenticating, the urls hash will
  // contain the access token.
  hasRedirectedFromAuth() {
    return !!this.getCodeFromUrl();
  }
}

export { DropboxStorageProvider };
