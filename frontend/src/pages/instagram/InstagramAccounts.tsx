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
  const [success, setSuccess] = useState("");

  const [connecting, setConnecting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
  | CONNECT / RECONNECT INSTAGRAM
  |--------------------------------------------------------------------------
  */

  const handleConnectInstagram = async () => {
    try {
      setConnecting(true);
      setError("");
      setSuccess("");

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
  | REMOVE / DISCONNECT INSTAGRAM ACCOUNT
  |--------------------------------------------------------------------------
  */

  const handleRemoveAccount = async (
    account: InstagramAccount
  ) => {
    const confirmed = window.confirm(
      `Remove Instagram account @${account.username}?\n\n` +
        "This will disconnect the account from this application " +
        "and it will no longer be available for automations."
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingId(account.id);
      setError("");
      setSuccess("");

      console.log(
        "Removing Instagram account:",
        account.id
      );

      const response = await api.delete(
        `/api/instagram/accounts/${account.id}`
      );

      console.log(
        "Instagram account remove response:",
        response.data
      );

      if (
        response.data?.success === false
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to remove Instagram account."
        );
      }

      setSuccess(
        `@${account.username} disconnected successfully.`
      );

      /*
      |--------------------------------------------------------------------------
      | REMOVE FROM LOCAL STATE IMMEDIATELY
      |--------------------------------------------------------------------------
      */

      setAccounts((currentAccounts) =>
        currentAccounts.filter(
          (item) =>
            item.id !== account.id
        )
      );

      /*
      |--------------------------------------------------------------------------
      | REFRESH FROM BACKEND
      |--------------------------------------------------------------------------
      */

      await loadAccounts();
    } catch (error: any) {
      console.error(
        "Failed to remove Instagram account:",
        error
      );

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to remove Instagram account."
      );
    } finally {
      setRemovingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLE OAUTH RETURN
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

      setSuccess(
        "Instagram account connected successfully."
      );

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
            "Instagram OAuth session is missing.";
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

      window.history.replaceState(
        {},
        document.title,
        "/instagram-accounts"
      );
    }

    loadAccounts();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>
      {/* ---------------------------------------------------------------- */}
      {/* HEADER                                                           */}
      {/* ---------------------------------------------------------------- */}

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

      {/* ---------------------------------------------------------------- */}
      {/* SUCCESS                                                          */}
      {/* ---------------------------------------------------------------- */}

      {success && (
        <section className="overview-card">
          <div className="auth-success">
            {success}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* ERROR                                                            */}
      {/* ---------------------------------------------------------------- */}

      {error && (
        <section className="overview-card">
          <div className="auth-error">
            {error}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* LOADING                                                          */}
      {/* ---------------------------------------------------------------- */}

      {loading && (
        <section className="overview-card">
          <div className="empty-activity">
            <strong>
              Loading Instagram accounts...
            </strong>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* EMPTY STATE                                                      */}
      {/* ---------------------------------------------------------------- */}

      {!loading &&
        !error &&
        accounts.length === 0 && (
          <section className="overview-card">
            <div className="empty-activity">
              <div className="empty-icon">
                ◎
              </div>

              <strong>
                No Instagram accounts connected.
              </strong>

              <p>
                Connect your Instagram account
                to start creating automations.
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

      {/* ---------------------------------------------------------------- */}
      {/* CONNECTED ACCOUNTS                                               */}
      {/* ---------------------------------------------------------------- */}

      {!loading &&
        accounts.length > 0 && (
          <section className="accounts-grid">
            {accounts.map((account) => {
              const isRemoving =
                removingId === account.id;

              return (
                <div
                  className="account-card"
                  key={account.id}
                >
                  {/* ---------------------------------------------------- */}
                  {/* ACCOUNT TOP                                           */}
                  {/* ---------------------------------------------------- */}

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

                  {/* ---------------------------------------------------- */}
                  {/* ACCOUNT STATUS                                        */}
                  {/* ---------------------------------------------------- */}

                  <div
                    className="account-card-bottom"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
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

                    {/* ------------------------------------------------ */}
                    {/* ACTIONS                                           */}
                    {/* ------------------------------------------------ */}

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      {/* RECONNECT */}

                      <button
                        type="button"
                        onClick={
                          handleConnectInstagram
                        }
                        disabled={
                          connecting ||
                          isRemoving
                        }
                        style={{
                          padding:
                            "8px 14px",
                          borderRadius:
                            "8px",
                          border:
                            "1px solid #d1d5db",
                          background:
                            "transparent",
                          cursor:
                            connecting ||
                            isRemoving
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            connecting ||
                            isRemoving
                              ? 0.6
                              : 1,
                          fontWeight: 600,
                        }}
                      >
                        {connecting
                          ? "Connecting..."
                          : "Reconnect"}
                      </button>

                      {/* REMOVE */}

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveAccount(
                            account
                          )
                        }
                        disabled={
                          isRemoving ||
                          connecting
                        }
                        style={{
                          padding:
                            "8px 14px",
                          borderRadius:
                            "8px",
                          border:
                            "1px solid #ef4444",
                          background:
                            "transparent",
                          color:
                            "#dc2626",
                          cursor:
                            isRemoving ||
                            connecting
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            isRemoving ||
                            connecting
                              ? 0.6
                              : 1,
                          fontWeight: 600,
                        }}
                      >
                        {isRemoving
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
    </DashboardLayout>
  );
}

export default InstagramAccounts;