import DashboardLayout from "../../components/layout/DashboardLayout";

function Dashboard() {
  const stats = [
    {
      title: "Total Automations",
      value: "0",
      subtitle: "Active",
      icon: "⚡",
      iconClass: "pink",
    },
    {
      title: "Instagram Accounts",
      value: "0",
      subtitle: "Connected",
      icon: "◎",
      iconClass: "purple",
    },
    {
      title: "Messages Sent",
      value: "0",
      subtitle: "This Week",
      icon: "➤",
      iconClass: "magenta",
    },
    {
      title: "Files",
      value: "0",
      subtitle: "Uploaded",
      icon: "▣",
      iconClass: "orange",
    },
  ];

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome back. Here's what's happening with your account.
          </p>
        </div>

        <button className="date-button">
          <span>▣</span>
          May 22, 2025 - May 28, 2025
          <span>⌄</span>
        </button>
      </div>

      <section className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.title}>
            <div className={`stat-icon ${stat.iconClass}`}>
              {stat.icon}
            </div>

            <div className="stat-content">
              <div className="stat-title">{stat.title}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-subtitle">{stat.subtitle}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="dashboard-lower">
        <div className="overview-card">
          <h2>Overview</h2>

          <div className="chart">
            <div className="chart-y-axis">
              <span>10</span>
              <span>8</span>
              <span>6</span>
              <span>4</span>
              <span>2</span>
              <span>0</span>
            </div>

            <div className="chart-area">
              <div className="chart-line" />

              <div className="chart-dates">
                <span>May 22</span>
                <span>May 23</span>
                <span>May 24</span>
                <span>May 25</span>
                <span>May 26</span>
                <span>May 27</span>
                <span>May 28</span>
              </div>
            </div>
          </div>
        </div>

        <div className="activity-card">
          <h2>Recent Activity</h2>

          <div className="empty-activity">
            <strong>No activity yet.</strong>

            <p>
              Once you start using the platform, your activities
              will appear here.
            </p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default Dashboard;