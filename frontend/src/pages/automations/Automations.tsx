import { useEffect, useState, type FormEvent } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface InstagramAccount {
  id: string;
  instagramUserId: string;
  username: string;
  name?: string | null;
  status: string;
}

interface AutomationFile {
  id: string;
  name: string;
  mimeType: string;
}

interface Automation {
  id: string;
  instagramAccountId: string;
  targetUrl: string;
  mediaId?: string | null;
  targetType: "POST" | "REEL";
  publicReply?: string | null;
  dmMessage?: string | null;
  fileId?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;

  file?: AutomationFile | null;

  instagramAccount?: InstagramAccount | null;
}

interface FileItem {
  id: string;
  name: string;
  mimeType: string;
}

function getAuthHeaders(): HeadersInit {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
}

export default function Automations() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [instagramAccountId, setInstagramAccountId] =
    useState("");

  const [targetUrl, setTargetUrl] = useState("");

  const [targetType, setTargetType] =
    useState<"POST" | "REEL">("POST");

  const [publicReply, setPublicReply] = useState("");
  const [dmMessage, setDmMessage] = useState("");
  const [fileId, setFileId] = useState("");

  // Detect dark theme from DashboardLayout
  const [isDark, setIsDark] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | THEME DETECTION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const checkTheme = () => {
      const appShell =
        document.querySelector(".app-shell");

      setIsDark(
        appShell?.classList.contains("dark-theme") ?? false
      );
    };

    checkTheme();

    const observer = new MutationObserver(() => {
      checkTheme();
    });

    const appShell =
      document.querySelector(".app-shell");

    if (appShell) {
      observer.observe(appShell, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | THEME COLORS
  |--------------------------------------------------------------------------
  */

  const colors = {
    pageText: isDark ? "#f8fafc" : "#111827",
    secondaryText: isDark ? "#94a3b8" : "#666",
    cardBackground: isDark ? "#151d2e" : "#ffffff",
    inputBackground: isDark ? "#0f172a" : "#ffffff",
    inputText: isDark ? "#f8fafc" : "#111827",
    inputBorder: isDark ? "#334155" : "#d1d5db",
    softBackground: isDark ? "#1e293b" : "#f9fafb",
    softBorder: isDark ? "#334155" : "#e5e7eb",
    divider: isDark ? "#334155" : "#eeeeee",
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const headers = getAuthHeaders();

      const [
        accountsResponse,
        automationsResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/instagram/accounts`,
          {
            method: "GET",
            headers,
          }
        ),

        fetch(
          `${API_BASE_URL}/api/instagram/automations`,
          {
            method: "GET",
            headers,
          }
        ),
      ]);

      const accountsData =
        await accountsResponse.json();

      const automationsData =
        await automationsResponse.json();

      if (!accountsResponse.ok) {
        throw new Error(
          accountsData.message ||
            "Failed to load Instagram accounts"
        );
      }

      if (!automationsResponse.ok) {
        throw new Error(
          automationsData.message ||
            "Failed to load automations"
        );
      }

      const loadedAccounts =
        accountsData.accounts || [];

      const loadedAutomations =
        automationsData.automations || [];

      setAccounts(loadedAccounts);
      setAutomations(loadedAutomations);

      /*
      |--------------------------------------------------------------------------
      | AUTO SELECT FIRST ACCOUNT
      |--------------------------------------------------------------------------
      */

      if (
        !instagramAccountId &&
        loadedAccounts.length > 0
      ) {
        setInstagramAccountId(
          loadedAccounts[0].id
        );
      }
    } catch (err) {
      console.error(
        "Failed to load automation data:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load automation data"
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD FILES
  |--------------------------------------------------------------------------
  */

  async function loadFiles() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/files`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setFiles(data.files || []);
    } catch (err) {
      console.error(
        "Failed to load files:",
        err
      );
    }
  }

  useEffect(() => {
    loadData();
    loadFiles();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CREATE AUTOMATION
  |--------------------------------------------------------------------------
  */

  async function handleCreateAutomation(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!instagramAccountId) {
      setError(
        "Please select an Instagram account."
      );
      return;
    }

    if (!targetUrl.trim()) {
      setError(
        "Please enter the Instagram post/reel URL."
      );
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | AT LEAST ONE ACTION REQUIRED
    |--------------------------------------------------------------------------
    */

    if (
      !publicReply.trim() &&
      !dmMessage.trim() &&
      !fileId
    ) {
      setError(
        "Please configure at least one automation action."
      );
      return;
    }

    try {
      setCreating(true);

      /*
      |--------------------------------------------------------------------------
      | CREATE AUTOMATION REQUEST
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      | Media ID is intentionally NOT sent here.
      |
      | The backend creates the automation with:
      | mediaId = null
      |
      | Instagram webhook later provides the real Media ID.
      |--------------------------------------------------------------------------
      */

      const response = await fetch(
        `${API_BASE_URL}/api/instagram/automations`,
        {
          method: "POST",
          headers: getAuthHeaders(),

          body: JSON.stringify({
            instagramAccountId,

            targetUrl:
              targetUrl.trim(),

            targetType,

            publicReply:
              publicReply.trim() || null,

            dmMessage:
              dmMessage.trim() || null,

            fileId:
              fileId || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create automation"
        );
      }

      console.log(
        "✅ AUTOMATION CREATED FROM FRONTEND"
      );

      console.log(
        "Automation:",
        data.automation || data
      );

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      setSuccess(
        "Automation created successfully."
      );

      /*
      |--------------------------------------------------------------------------
      | RESET FORM
      |--------------------------------------------------------------------------
      */

      setTargetUrl("");
      setTargetType("POST");
      setPublicReply("");
      setDmMessage("");
      setFileId("");

      /*
      |--------------------------------------------------------------------------
      | REFRESH AUTOMATION LIST
      |--------------------------------------------------------------------------
      */

      await loadData();
    } catch (err) {
      console.error(
        "Create automation error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create automation"
      );
    } finally {
      setCreating(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FORMAT DATE
  |--------------------------------------------------------------------------
  */

  function formatDate(value: string) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          color: colors.pageText,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Automations</h1>

        <p
          style={{
            color: colors.secondaryText,
          }}
        >
          Loading automations...
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        color: colors.pageText,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              color: colors.pageText,
            }}
          >
            Automations
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: colors.secondaryText,
            }}
          >
            Automatically reply to Instagram
            comments and send private messages.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          style={{
            padding: "10px 16px",
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: "8px",
            background: colors.cardBackground,
            color: colors.pageText,
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: isDark
              ? "#451a1a"
              : "#fee2e2",
            color: isDark
              ? "#fecaca"
              : "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: isDark
              ? "#123522"
              : "#dcfce7",
            color: isDark
              ? "#bbf7d0"
              : "#166534",
          }}
        >
          {success}
        </div>
      )}

      {/* NO INSTAGRAM ACCOUNT */}

      {accounts.length === 0 && (
        <div
          style={{
            padding: "20px",
            marginBottom: "30px",
            border: `1px solid ${colors.softBorder}`,
            borderRadius: "10px",
            background: colors.softBackground,
          }}
        >
          <h3>
            Connect an Instagram account
          </h3>

          <p
            style={{
              color: colors.secondaryText,
            }}
          >
            You need at least one active
            Instagram account before creating
            an automation.
          </p>
        </div>
      )}

      {/* CREATE AUTOMATION */}

      {accounts.length > 0 && (
        <form
          onSubmit={handleCreateAutomation}
          style={{
            border: `1px solid ${colors.softBorder}`,
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "40px",
            background: colors.cardBackground,
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: colors.pageText,
            }}
          >
            Create Automation
          </h2>

          {/* INSTAGRAM ACCOUNT */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
                color: colors.pageText,
              }}
            >
              Instagram Account
            </label>

            <select
              value={instagramAccountId}
              onChange={(e) =>
                setInstagramAccountId(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: "8px",
                fontSize: "15px",
                background: colors.inputBackground,
                color: colors.inputText,
              }}
            >
              {accounts.map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  @{account.username}
                  {account.name
                    ? ` — ${account.name}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* TARGET TYPE */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
                color: colors.pageText,
              }}
            >
              Target Type
            </label>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              {(
                ["POST", "REEL"] as const
              ).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setTargetType(type)
                  }
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border:
                      targetType === type
                        ? "2px solid #111"
                        : `1px solid ${colors.inputBorder}`,
                    background:
                      targetType === type
                        ? "#111"
                        : colors.cardBackground,
                    color:
                      targetType === type
                        ? "#fff"
                        : colors.pageText,
                    cursor: "pointer",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* TARGET URL */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
                color: colors.pageText,
              }}
            >
              Instagram Post / Reel URL
            </label>

            <input
              type="url"
              value={targetUrl}
              onChange={(e) =>
                setTargetUrl(e.target.value)
              }
              placeholder="https://www.instagram.com/p/..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: "8px",
                fontSize: "15px",
                background: colors.inputBackground,
                color: colors.inputText,
              }}
            />
          </div>

          {/* MEDIA ID */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: colors.softBackground,
                border: `1px solid ${colors.softBorder}`,
              }}
            >
              <strong
                style={{
                  color: colors.pageText,
                }}
              >
                Media ID
              </strong>

              <p
                style={{
                  margin:
                    "6px 0 0",
                  color: colors.secondaryText,
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                Media ID is handled automatically by
                the Instagram webhook. You do not need
                to enter it manually.
              </p>
            </div>
          </div>

          {/* PUBLIC REPLY */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
                color: colors.pageText,
              }}
            >
              Public Comment Reply
            </label>

            <textarea
              value={publicReply}
              onChange={(e) =>
                setPublicReply(e.target.value)
              }
              placeholder="Thanks for your comment! ❤️"
              rows={4}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: "8px",
                fontSize: "15px",
                resize: "vertical",
                background: colors.inputBackground,
                color: colors.inputText,
              }}
            />
          </div>

          {/* DM MESSAGE */}

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
                color: colors.pageText,
              }}
            >
              Private DM Message
            </label>

            <textarea
              value={dmMessage}
              onChange={(e) =>
                setDmMessage(e.target.value)
              }
              placeholder="Hi! Thanks for your comment. Here is the information you requested."
              rows={5}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: "8px",
                fontSize: "15px",
                resize: "vertical",
                background: colors.inputBackground,
                color: colors.inputText,
              }}
            />
          </div>

          {/* FILE */}

          <div
            style={{
              marginBottom: "24px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "8px",
                color: colors.pageText,
              }}
            >
              Attach File
            </label>

            <select
              value={fileId}
              onChange={(e) =>
                setFileId(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: "8px",
                fontSize: "15px",
                background: colors.inputBackground,
                color: colors.inputText,
              }}
            >
              <option value="">
                No file
              </option>

              {files.map((file) => (
                <option
                  key={file.id}
                  value={file.id}
                >
                  {file.name}
                </option>
              ))}
            </select>

            {files.length === 0 && (
              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: colors.secondaryText,
                }}
              >
                No files available.
              </small>
            )}
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={creating}
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              background: creating
                ? "#777"
                : "#111",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              cursor: creating
                ? "not-allowed"
                : "pointer",
            }}
          >
            {creating
              ? "Creating..."
              : "Create Automation"}
          </button>
        </form>
      )}

      {/* AUTOMATION LIST */}

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: colors.pageText,
            }}
          >
            Your Automations
          </h2>

          <span
            style={{
              color: colors.secondaryText,
            }}
          >
            {automations.length} automation
            {automations.length === 1
              ? ""
              : "s"}
          </span>
        </div>

        {automations.length === 0 ? (
          <div
            style={{
              padding: "30px",
              border: `1px solid ${colors.softBorder}`,
              borderRadius: "10px",
              textAlign: "center",
              color: colors.secondaryText,
              background: colors.cardBackground,
            }}
          >
            No automations created yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {automations.map(
              (automation) => (
                <div
                  key={automation.id}
                  style={{
                    border: `1px solid ${colors.softBorder}`,
                    borderRadius: "12px",
                    padding: "20px",
                    background: colors.cardBackground,
                  }}
                >
                  {/* CARD HEADER */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "20px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: "0 0 6px",
                          color: colors.pageText,
                        }}
                      >
                        {automation
                          .instagramAccount
                          ?.username
                          ? `@${automation.instagramAccount.username}`
                          : "Instagram Account"}
                      </h3>

                      <div
                        style={{
                          color: colors.secondaryText,
                          fontSize: "14px",
                        }}
                      >
                        {automation.targetType}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "5px 10px",
                        borderRadius: "20px",
                        background:
                          automation.status ===
                          "ACTIVE"
                            ? isDark
                              ? "#123522"
                              : "#dcfce7"
                            : isDark
                            ? "#334155"
                            : "#f3f4f6",
                        color:
                          automation.status ===
                          "ACTIVE"
                            ? isDark
                              ? "#86efac"
                              : "#166534"
                            : colors.secondaryText,
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      {automation.status}
                    </span>
                  </div>

                  {/* TARGET URL */}

                  <div
                    style={{
                      marginTop: "16px",
                    }}
                  >
                    <strong
                      style={{
                        color: colors.pageText,
                      }}
                    >
                      Target:
                    </strong>

                    <div
                      style={{
                        marginTop: "5px",
                        wordBreak: "break-all",
                        color: colors.secondaryText,
                      }}
                    >
                      {automation.targetUrl}
                    </div>
                  </div>

                  {/* PUBLIC REPLY */}

                  {automation.publicReply && (
                    <div
                      style={{
                        marginTop: "16px",
                      }}
                    >
                      <strong
                        style={{
                          color: colors.pageText,
                        }}
                      >
                        Public Reply
                      </strong>

                      <div
                        style={{
                          marginTop: "6px",
                          padding: "10px",
                          background:
                            colors.softBackground,
                          borderRadius: "6px",
                          whiteSpace: "pre-wrap",
                          color: colors.pageText,
                        }}
                      >
                        {automation.publicReply}
                      </div>
                    </div>
                  )}

                  {/* DM */}

                  {automation.dmMessage && (
                    <div
                      style={{
                        marginTop: "16px",
                      }}
                    >
                      <strong
                        style={{
                          color: colors.pageText,
                        }}
                      >
                        Private DM
                      </strong>

                      <div
                        style={{
                          marginTop: "6px",
                          padding: "10px",
                          background:
                            colors.softBackground,
                          borderRadius: "6px",
                          whiteSpace: "pre-wrap",
                          color: colors.pageText,
                        }}
                      >
                        {automation.dmMessage}
                      </div>
                    </div>
                  )}

                  {/* FILE */}

                  {automation.file && (
                    <div
                      style={{
                        marginTop: "16px",
                        color: colors.pageText,
                      }}
                    >
                      <strong>
                        Attached File:
                      </strong>{" "}
                      {automation.file.name}
                    </div>
                  )}

                  {/* CREATED */}

                  <div
                    style={{
                      marginTop: "18px",
                      paddingTop: "12px",
                      borderTop: `1px solid ${colors.divider}`,
                      color: colors.secondaryText,
                      fontSize: "13px",
                    }}
                  >
                    Created:{" "}
                    {formatDate(
                      automation.createdAt
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}