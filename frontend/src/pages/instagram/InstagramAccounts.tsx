import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

type InstagramAccount = {
  id: string;
  instagramUserId: string;
  username: string;
  name?: string | null;
  status?: string;
  createdAt?: string;
};

function InstagramAccounts() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD INSTAGRAM ACCOUNTS
  |--------------------------------------------------------------------------
  */

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/api/instagram/accounts"
      );

      setAccounts(
        response.data?.accounts || []
      );
    } catch (error: any) {
      console.error(
        "Failed to load Instagram accounts:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to load Instagram accounts."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CONNECT INSTAGRAM ACCOUNT
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | We first call our backend using Axios.
  |
  | Axios automatically adds:
  | Authorization: Bearer <JWT>
  |
  | Backend then creates the Instagram OAuth URL
  | with the logged-in user's ID inside signed state.
  |--------------------------------------------------------------------------
  */

  const handleConnectInstagram =
    async () => {
      try {
        setConnecting(true);
        setError("");

        console.log(
          "Starting Instagram OAuth..."
        );

        const response = await api.get(
          "/api/instagram/oauth"
        );

        console.log(
          "Instagram OAuth response:",
          response.data
        );

        if (
          !response.data?.success ||
          !response.data?.authUrl
        ) {
          throw new Error(
            response.data?.message ||
              "Failed to start Instagram OAuth."
          );
        }

        /*
        |--------------------------------------------------------------------------
        | REDIRECT USER TO INSTAGRAM
        |--------------------------------------------------------------------------
        */

        window.location.href =
          response.data.authUrl;
      } catch (error: any) {
        console.error(
          "Instagram OAuth start error:",
          error
        );

        setConnecting(false);

        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to connect Instagram account."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | READ CONNECTED PARAMETER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const connected =
      params.get("connected");

    const oauthError =
      params.get("error");

    if (connected === "true") {
      console.log(
        "Instagram account connected successfully."
      );

      /*
      |----------------------------------------------------------------------
      | Remove query parameters from URL
      |----------------------------------------------------------------------
      */

      window.history.replaceState(
        {},
        document.title,
        "/instagram-accounts"
      );
    }

    if (oauthError) {
      console.error(
        "Instagram OAuth error:",
        oauthError
      );

      let message =
        "Instagram connection failed.";

      switch (oauthError) {
        case "instagram_denied":
          message =
            "Instagram authorization was denied.";
          break;

        case "missing_code":
          message =
            "Instagram authorization code is missing.";
          break;

        case "missing_state":
          message =
            "Instagram OAuth state is missing.";
          break;

        case "invalid_state":
          message =
            "Instagram OAuth session expired or is invalid. Please try again.";
          break;

        case "token_exchange_failed":
          message =
            "Failed to exchange Instagram authorization code.";
          break;

        case "profile_failed":
          message =
            "Failed to get Instagram account information.";
          break;

        case "oauth_failed":
          message =
            "Instagram OAuth failed. Please try again.";
          break;

        default:
          message =
            "Instagram connection failed. Please try again.";
      }

      setError(message);

      /*
      |----------------------------------------------------------------------
      | Remove error query parameter from URL
      |----------------------------------------------------------------------
      */

      window.history.replaceState(
        {},
        document.title,
        "/instagram-accounts"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Load accounts after returning from OAuth
    |--------------------------------------------------------------------------
    */

    loadAccounts();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="dashboard-header">
        <div>
          <h1>Instagram Accounts</h1>

          <p>
            Connect and manage the Instagram
            accounts used by your automations.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={
            handleConnectInstagram
          }
          disabled={
            connecting || loading
          }
        >
          {connecting
            ? "Connecting..."
            : "+ Connect Instagram Account"}
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ERROR                                                             */}
      {/* ------------------------------------------------------------------ */}

      {error && (
        <section className="overview-card">
          <div className="auth-error">
            {error}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* LOADING                                                           */}
      {/* ------------------------------------------------------------------ */}

      {loading && (
        <section className="overview-card">
          <div className="empty-activity">
            <strong>
              Loading Instagram accounts...
            </strong>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* EMPTY STATE                                                       */}
      {/* ------------------------------------------------------------------ */}

      {!loading &&
        !error &&
        accounts.length === 0 && (
          <section className="overview-card">
            <div className="empty-activity">
              <div className="empty-icon">
                ◎
              </div>

              <strong>
                No Instagram accounts
                connected.
              </strong>

              <p>
                Connect your Instagram
                account to start creating
                automations.
              </p>

              <button
                className="primary-button"
                onClick={
                  handleConnectInstagram
                }
                disabled={connecting}
              >
                {connecting
                  ? "Connecting..."
                  : "+ Connect Instagram Account"}
              </button>
            </div>
          </section>
        )}

      {/* ------------------------------------------------------------------ */}
      {/* CONNECTED ACCOUNTS                                                */}
      {/* ------------------------------------------------------------------ */}

      {!loading &&
        !error &&
        accounts.length > 0 && (
          <section className="accounts-grid">
            {accounts.map((account) => (
              <div
                className="account-card"
                key={account.id}
              >
                {/* ------------------------------------------------------ */}
                {/* ACCOUNT TOP                                             */}
                {/* ------------------------------------------------------ */}

                <div className="account-card-top">
                  <div className="account-avatar">
                    ◎
                  </div>

                  <div>
                    <h2>
                      {account.name ||
                        account.username}
                    </h2>

                    <p>
                      @{account.username}
                    </p>
                  </div>
                </div>

                {/* ------------------------------------------------------ */}
                {/* ACCOUNT BOTTOM                                          */}
                {/* ------------------------------------------------------ */}

                <div className="account-card-bottom">
                  <span
                    className={`account-status ${
                      account.status ===
                      "ACTIVE"
                        ? "active"
                        : ""
                    }`}
                  >
                    {account.status ||
                      "ACTIVE"}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}
    </DashboardLayout>
  );
}

export default InstagramAccounts;