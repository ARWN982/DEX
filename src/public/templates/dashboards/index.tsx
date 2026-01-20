import {
  useEuiTheme,
} from "@elastic/eui";
import React, { useState } from "react";
import {
  NewNav,
  AppContainer,
  KibanaHeader,
  DashboardGrid,
  GridItem,
  TextPanel,
  MetricPanel,
} from "../../components";
import { useAppStore } from "../../store/useAppStore";

export const Dashboards: React.FC = () => {
  const { euiTheme } = useEuiTheme();
  const { colorMode, setColorMode } = useAppStore();

  // Initial grid items with example panels
  const [gridItems, setGridItems] = useState<GridItem[]>([
    {
      id: "1",
      x: 0,
      y: 0,
      w: 6,
      h: 3,
      minW: 2,
      minH: 1,
      content: <TextPanel title="Sample Logs Data" content="This is a sample text panel demonstrating the dashboard grid layout." />,
    },
    {
      id: "2",
      x: 6,
      y: 0,
      w: 3,
      h: 3,
      minW: 2,
      minH: 1,
      content: <MetricPanel title="Visits" value={12543} description="Total visits" trend={{ value: 12, label: "vs last week" }} />,
    },
    {
      id: "3",
      x: 9,
      y: 0,
      w: 3,
      h: 3,
      minW: 2,
      minH: 1,
      content: <MetricPanel title="Unique Visitors" value={8234} description="Unique users" color="warning" />,
    },
    {
      id: "4",
      x: 0,
      y: 3,
      w: 6,
      h: 4,
      minW: 4,
      minH: 1,
      content: <TextPanel title="Chart Placeholder" content="This area can contain charts, visualizations, or other dashboard components." />,
    },
    {
      id: "5",
      x: 6,
      y: 3,
      w: 3,
      h: 2,
      minW: 2,
      minH: 1,
      content: <MetricPanel title="HTTP 4xx (%)" value="2.3%" color="warning" />,
    },
    {
      id: "6",
      x: 9,
      y: 3,
      w: 3,
      h: 2,
      minW: 2,
      minH: 1,
      content: <MetricPanel title="HTTP 5xx (%)" value="0.1%" color="danger" />,
    },
  ]);

  const toggleColorMode = () => {
    setColorMode(colorMode === "light" ? "dark" : "light");
  };

  const handleAssistantClick = () => {
    // TODO: Implement assistant functionality
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      <NewNav activeItem="dashboards" />
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
              <DashboardGrid
                items={gridItems}
                onItemsChange={setGridItems}
                columns={12}
                rowHeight={20}
                gap={8}
              />
            </div>
          </AppContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboards;
