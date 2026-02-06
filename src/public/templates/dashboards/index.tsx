import {
  useEuiTheme,
  EuiHorizontalRule,
} from "@elastic/eui";
import React, { useState, useMemo } from "react";
import {
  NavBar,
  AppContainer,
  KibanaHeader,
  DashboardGrid,
  GridItem,
  MarkdownPanel,
  MetricPanel,
  TimeSeriesPanel,
  LinksPanel,
  ControlPanel,
  TablePanel,
  SectionHeader,
  StackedBarChartPanel,
  PanelSettingsFlyout,
  DashboardLevaPanel,
} from "../../components";
import { useAppStore } from "../../store/useAppStore";
import { useDashboardPanelSettings } from "../../store/useDashboardPanelSettings";

// Generate sample time series data
const generateTimeSeriesData = (hours: number = 24, baseValue: number = 50, variance: number = 30) => {
  const now = Date.now();
  const data = [];
  for (let i = 0; i < hours; i++) {
    data.push({
      x: now - (hours - 1 - i) * 3600000,
      y: Math.floor(baseValue + (Math.random() - 0.5) * variance * 2),
    });
  }
  return data;
};

// Generate stacked bar chart data for CPU Usage (colors are set in the component)
const generateStackedBarData = (vis0Color: string, vis1Color: string) => {
  // Start at 10:00:00 on May 15, 2023
  const startTime = new Date(2023, 4, 15, 10, 0, 0).getTime();
  const dataPointsCount = 100; // ~10 hours of data with ~6 min intervals
  const intervalMs = (9 * 60 * 60 * 1000) / dataPointsCount; // 9 hours spread

  const usageA = [];
  const usageB = [];

  for (let i = 0; i < dataPointsCount; i++) {
    const timestamp = startTime + i * intervalMs;
    // Usage A: 0.8 - 2.2 GHz range
    const valueA = 0.8 + Math.random() * 1.4;
    // Usage B: 0.5 - 1.5 GHz range (stacked on top)
    const valueB = 0.5 + Math.random() * 1.0;

    usageA.push({ x: timestamp, y: valueA });
    usageB.push({ x: timestamp, y: valueB });
  }

  return [
    { id: "usageA", name: "usage A", data: usageA, color: vis0Color },
    { id: "usageB", name: "usage B", data: usageB, color: vis1Color },
  ];
};

export const Dashboards: React.FC = () => {
  const { euiTheme } = useEuiTheme();
  const { colorMode, setColorMode } = useAppStore();
  const { gridGap } = useDashboardPanelSettings();
  const [settingsFlyoutOpen, setSettingsFlyoutOpen] = useState(false);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  // Top grid items (above the section header)
  // Grid uses 48 columns
  // Row 1: LinksPanel (full width)
  // Row 2: Markdown, CPU Usage Chart, Table (3 columns)
  const [topGridItems, setTopGridItems] = useState<GridItem[]>([
    // Row 1: Links Panel (full width)
    {
      i: "links",
      x: 0,
      y: 0,
      w: 48,
      h: 3,
      minW: 8,
      minH: 1,
      title: "Key Dashboards",
      showTitle: true,
      panelType: "links",
      content: (
        <LinksPanel
          links={[
            { id: "1", label: "Cluster Monitoring", href: "#", isActive: true },
            { id: "2", label: "ES Index Monitoring", href: "#" },
            { id: "3", label: "SSH logins", href: "#" },
            { id: "4", label: "Cluster & Node View", href: "#" },
            { id: "5", label: "Index & Shard View", href: "#" },
          ]}
          direction="horizontal"
          gap={24}
        />
      ),
    },
    // Row 2: CPU Usage Stacked Bar Chart
    {
      i: "cpu-usage",
      x: 0,
      y: 3,
      w: 24,
      h: 10,
      minW: 12,
      minH: 6,
      title: "CPU Usage",
      showTitle: true,
      content: (
        <StackedBarChartPanel
          series={generateStackedBarData(euiTheme.colors.vis.euiColorVis0, euiTheme.colors.vis.euiColorVis1)}
          showLegend={true}
          valueFormatter={(v) => {
            if (v === 0) return "0";
            return `${v}GHz`;
          }}
          timeFormatter={(v) => {
            const date = new Date(v);
            return date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            });
          }}
        />
      ),
    },
    // Row 2: Hosts Table
    {
      i: "table-hosts",
      x: 24,
      y: 3,
      w: 24,
      h: 10,
      minW: 12,
      minH: 6,
      title: "Hosts",
      showTitle: true,
      panelType: "table",
      content: (
        <TablePanel
          columns={[
            { id: "hostname", displayAsText: "Hostname" },
            { id: "status", displayAsText: "Status", dataType: "status" },
            { id: "cpu", displayAsText: "CPU %" },
            { id: "memory", displayAsText: "Memory %" },
            { id: "os", displayAsText: "Operating System" },
            { id: "ip", displayAsText: "IP Address" },
            { id: "lastSeen", displayAsText: "Last Seen" },
          ]}
          data={[
            { hostname: "gke-prod-cluster-pool-a1b2c3d4-node-001", status: "Online", cpu: "23%", memory: "67%", os: "Container-Optimized OS", ip: "10.128.0.42", lastSeen: "2024-10-31T14:23:18Z" },
            { hostname: "gke-prod-cluster-pool-a1b2c3d4-node-002", status: "Online", cpu: "45%", memory: "72%", os: "Container-Optimized OS", ip: "10.128.0.43", lastSeen: "2024-10-31T14:23:15Z" },
            { hostname: "gke-prod-cluster-pool-e5f6g7h8-node-001", status: "Online", cpu: "12%", memory: "54%", os: "Container-Optimized OS", ip: "10.128.1.15", lastSeen: "2024-10-31T14:23:12Z" },
            { hostname: "ip-172-31-22-156.ec2.internal", status: "Online", cpu: "67%", memory: "81%", os: "Amazon Linux 2023", ip: "172.31.22.156", lastSeen: "2024-10-31T14:22:58Z" },
            { hostname: "ip-172-31-45-203.ec2.internal", status: "Online", cpu: "8%", memory: "42%", os: "Amazon Linux 2023", ip: "172.31.45.203", lastSeen: "2024-10-31T14:23:01Z" },
            { hostname: "worker-node-prod-us-east1-b-x9k2", status: "Offline", cpu: "0%", memory: "0%", os: "Ubuntu 22.04 LTS", ip: "10.142.0.89", lastSeen: "2024-10-30T08:14:32Z" },
            { hostname: "web-server-prod-01.example.com", status: "Online", cpu: "34%", memory: "58%", os: "RHEL 9.2", ip: "192.168.1.101", lastSeen: "2024-10-31T14:23:20Z" },
            { hostname: "db-replica-secondary-02", status: "Online", cpu: "52%", memory: "89%", os: "Ubuntu 22.04 LTS", ip: "10.0.2.55", lastSeen: "2024-10-31T14:23:18Z" },
          ]}
        />
      ),
    },
  ]);

  // Middle grid items (below the section header)
  // Grid uses 48 columns
  // Layout: 3 stacked controls on left (x=0, w=12), 4 metrics to the right (x=12, w=9 each)
  const [middleGridItems, setMiddleGridItems] = useState<GridItem[]>([
    // 3 Controls stacked vertically on the left
    {
      i: "ctrl-1",
      x: 0,
      y: 0,
      w: 12,
      h: 2,
      minW: 8,
      minH: 2,
      showTitle: false,
      showBorder: true,
      panelType: "control",
      controlConfig: {
        label: "Source Country",
        options: [
          { value: "us", label: "US" },
          { value: "uk", label: "UK" },
          { value: "de", label: "Germany" },
          { value: "fr", label: "France" },
          { value: "jp", label: "Japan" },
        ],
        selectedValues: ["us"],
      },
      content: null,
    },
    {
      i: "ctrl-2",
      x: 0,
      y: 2,
      w: 12,
      h: 2,
      minW: 8,
      minH: 2,
      showTitle: false,
      showBorder: true,
      panelType: "control",
      controlConfig: {
        label: "OS",
        options: [
          { value: "windows", label: "Windows" },
          { value: "macos", label: "macOS" },
          { value: "linux", label: "Linux" },
          { value: "ios", label: "iOS" },
          { value: "android", label: "Android" },
        ],
        selectedValues: [],
      },
      content: null,
    },
    {
      i: "ctrl-3",
      x: 0,
      y: 4,
      w: 12,
      h: 2,
      minW: 8,
      minH: 2,
      showTitle: false,
      showBorder: true,
      panelType: "control",
      controlConfig: {
        label: "Log Level",
        options: [
          { value: "error", label: "Error" },
          { value: "warn", label: "Warning" },
          { value: "info", label: "Info" },
          { value: "debug", label: "Debug" },
        ],
        selectedValues: [],
      },
      content: null,
    },
    // 4 Metrics to the right of controls
    {
      i: "metric-1",
      x: 12,
      y: 0,
      w: 9,
      h: 6,
      minW: 4,
      minH: 1,
      title: "Error rate",
      showTitle: false,
      noPadding: true,
      content: (
        <MetricPanel 
          title="Error rate" 
          value={0.03}
          valuePostfix=" %"
          color="vis0"
          progressMax={0.1}
          progressBarDirection="vertical"
          valuePosition="top"
          titlesTextAlign="left"
          valueTextAlign="left"
          extraTextAlign="left"
          secondaryMetric={{
            value: "0.01%",
            label: "Last week",
            labelPosition: "before",
            badgeColor: "vis6",
            trendIcon: "increase",
            iconPosition: "after",
            badgeBorderColor: { mode: "none" },
          }}
        />
      ),
    },
    {
      i: "metric-2",
      x: 21,
      y: 0,
      w: 9,
      h: 6,
      minW: 4,
      minH: 1,
      title: "Resource Utilization",
      showTitle: false,
      noPadding: true,
      content: (
        <MetricPanel 
          title="Resource Utilization" 
          value={55.2}
          valuePostfix=" %"
          color="vis2"
          progressMax={100}
          progressBarDirection="vertical"
          valuePosition="top"
          titlesTextAlign="left"
          valueTextAlign="left"
          extraTextAlign="left"
          secondaryMetric={{
            value: "3.2%",
            label: "Last week",
            labelPosition: "before",
            badgeColor: "#24C292",
            trendIcon: "decrease",
            iconPosition: "after",
            badgeBorderColor: { mode: "none" },
          }}
        />
      ),
    },
    {
      i: "metric-3",
      x: 30,
      y: 0,
      w: 9,
      h: 6,
      minW: 4,
      minH: 1,
      title: "Log Ingestion Rate",
      showTitle: false,
      noPadding: true,
      content: (
        <MetricPanel 
          title="Log Ingestion Rate" 
          value={55.3}
          valuePostfix=" %"
          color="vis2"
          progressMax={100}
          progressBarDirection="vertical"
          valuePosition="top"
          titlesTextAlign="left"
          valueTextAlign="left"
          extraTextAlign="left"
          secondaryMetric={{
            value: "2.50%",
            label: "Last week",
            labelPosition: "before",
            badgeColor: "#24C292",
            trendIcon: "increase",
            iconPosition: "after",
            badgeBorderColor: { mode: "none" },
          }}
        />
      ),
    },
    {
      i: "metric-4",
      x: 39,
      y: 0,
      w: 9,
      h: 6,
      minW: 4,
      minH: 1,
      title: "P95 Latency",
      showTitle: false,
      noPadding: true,
      content: (
        <MetricPanel 
          title="P95 Latency" 
          value={210}
          valuePostfix=" ms"
          color="vis2"
          progressMax={1000}
          progressBarDirection="vertical"
          valuePosition="top"
          titlesTextAlign="left"
          valueTextAlign="left"
          extraTextAlign="left"
          secondaryMetric={{
            value: "10ms",
            label: "Last week",
            labelPosition: "before",
            badgeColor: "vis6",
            trendIcon: "increase",
            iconPosition: "after",
            badgeBorderColor: { mode: "none" },
          }}
        />
      ),
    },
  ]);

  // Third grid items (below the horizontal ruler) - time series charts
  const [thirdGridItems, setThirdGridItems] = useState<GridItem[]>([
    {
      i: "chart-1",
      x: 0,
      y: 0,
      w: 24,
      h: 10,
      minW: 4,
      minH: 1,
      title: "Requests Over Time",
      showTitle: true,
      content: <TimeSeriesPanel data={generateTimeSeriesData(24, 150, 50)} title="Requests" chartType="area" xAxisTitle="@timestamp per 1 hour" />,
    },
    {
      i: "chart-2",
      x: 24,
      y: 0,
      w: 24,
      h: 10,
      minW: 4,
      minH: 1,
      title: "Response Time",
      showTitle: true,
      content: (
        <TimeSeriesPanel 
          series={[
            { id: "p50", name: "P50 Latency", data: generateTimeSeriesData(24, 150, 50), color: euiTheme.colors.vis.euiColorVis0 },
            { id: "p95", name: "P95 Latency", data: generateTimeSeriesData(24, 280, 80), color: euiTheme.colors.vis.euiColorVis2 },
          ]}
          title="Latency (ms)" 
          chartType="line" 
          xAxisTitle="@timestamp per 1 hour"
          showLegend={false}
        />
      ),
    },
  ]);

  const handleSettingsClick = (itemId: string) => {
    setSelectedPanelId(itemId);
    setSettingsFlyoutOpen(true);
  };

  // Helper to update items in any grid
  const updateGridItems = (
    itemId: string,
    updater: (item: GridItem) => GridItem
  ) => {
    // Check if item is in top grid
    const topItem = topGridItems.find((item) => item.i === itemId);
    if (topItem) {
      setTopGridItems((prevItems) =>
        prevItems.map((item) => (item.i === itemId ? updater(item) : item))
      );
      return;
    }
    
    // Check if item is in middle grid
    const middleItem = middleGridItems.find((item) => item.i === itemId);
    if (middleItem) {
      setMiddleGridItems((prevItems) =>
        prevItems.map((item) => (item.i === itemId ? updater(item) : item))
      );
      return;
    }
    
    // Otherwise, it's in the third grid
    setThirdGridItems((prevItems) =>
      prevItems.map((item) => (item.i === itemId ? updater(item) : item))
    );
  };

  const handleSavePanelSettings = (itemId: string, title: string, showTitle: boolean, markdownContent?: string, showBorder?: boolean) => {
    updateGridItems(itemId, (item) => {
      const updatedItem = { ...item, title, showTitle };
      
      // Update markdown content if provided
      if (markdownContent !== undefined && item.panelType === "markdown") {
        updatedItem.markdownContent = markdownContent;
      }
      
      // Update showBorder if provided (for control panels)
      if (showBorder !== undefined && item.panelType === "control") {
        updatedItem.showBorder = showBorder;
      }
      
      return updatedItem;
    });
  };

  const toggleColorMode = () => {
    setColorMode(colorMode === "light" ? "dark" : "light");
  };

  const handleAssistantClick = () => {
    // TODO: Implement assistant functionality
  };

  // Helper to render dynamic content for markdown and control panels
  const renderDynamicContent = (items: GridItem[]) => {
    return items.map((item) => {
      if (item.panelType === "markdown") {
        return {
          ...item,
          content: <MarkdownPanel content={item.markdownContent} />,
        };
      }
      if (item.panelType === "control" && item.controlConfig) {
        return {
          ...item,
          content: (
            <ControlPanel
              label={item.controlConfig.label}
              options={item.controlConfig.options}
              selectedValues={item.controlConfig.selectedValues}
              showDropdownBorder={item.showBorder === false}
            />
          ),
        };
      }
      return item;
    });
  };

  // Compute grid items with dynamic content for markdown and control panels
  const renderedTopGridItems = useMemo(() => {
    return renderDynamicContent(topGridItems);
  }, [topGridItems]);

  const renderedMiddleGridItems = useMemo(() => {
    return renderDynamicContent(middleGridItems);
  }, [middleGridItems]);

  const renderedThirdGridItems = useMemo(() => {
    return renderDynamicContent(thirdGridItems);
  }, [thirdGridItems]);

  // Get all items for flyout lookup
  const allGridItems = useMemo(() => [...topGridItems, ...middleGridItems, ...thirdGridItems], [topGridItems, middleGridItems, thirdGridItems]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      <NavBar solution="o11y" activeItem="dashboard" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        <KibanaHeader
          colorMode={colorMode}
          onToggleColorMode={toggleColorMode}
          onAssistantClick={handleAssistantClick}
          isHomepage={false}
          display="classic"
        />
        <div style={{ flex: 1, position: "relative", overflow: "hidden", paddingTop: 0, paddingRight: euiTheme.size.s, paddingBottom: euiTheme.size.s, paddingLeft: 0 }}>
          <AppContainer>
            <div style={{ height: "100%", width: "100%", overflow: "auto" }}>
              {/* Top Grid */}
              <DashboardGrid
                items={renderedTopGridItems}
                onItemsChange={setTopGridItems}
                columns={48}
                rowHeight={20}
                gap={gridGap}
                onSettingsClick={handleSettingsClick}
                autoSize
              />
              
              {/* Section Header */}
              <div style={{ padding: `0 ${gridGap}px 0 ${gridGap}px` }}>
                <SectionHeader title="Key Metrics" />
              </div>
              
              {/* Middle Grid */}
              <DashboardGrid
                items={renderedMiddleGridItems}
                onItemsChange={setMiddleGridItems}
                columns={48}
                rowHeight={20}
                gap={gridGap}
                onSettingsClick={handleSettingsClick}
                autoSize
              />
              {/* Horizontal Divider to mimic collapsible section */}
              <div style={{ padding: `0 ${gridGap}px` }}>
                <EuiHorizontalRule margin="none" />
              </div>

              {/* Third Grid */}
              <DashboardGrid
                items={renderedThirdGridItems}
                onItemsChange={setThirdGridItems}
                columns={48}
                rowHeight={20}
                gap={gridGap}
                onSettingsClick={handleSettingsClick}
                autoSize
              />
              

            </div>
          </AppContainer>
        </div>
      </div>

      {/* Panel Settings Flyout */}
      <PanelSettingsFlyout
        isOpen={settingsFlyoutOpen}
        onClose={() => {
          setSettingsFlyoutOpen(false);
          setSelectedPanelId(null);
        }}
        item={allGridItems.find((item) => item.i === selectedPanelId) || null}
        onSave={handleSavePanelSettings}
      />

      {/* Leva Control Panel */}
      <DashboardLevaPanel />
    </div>
  );
};

export default Dashboards;
