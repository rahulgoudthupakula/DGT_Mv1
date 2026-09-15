import { TankStatusPanel } from "./TankStatusPanel";
import { GasPriceBox } from "./GasPriceBox";
import { GasExceptionsAlerts } from "./GasExceptionsAlerts";

export const GasDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Gas Prices at top */}
      <GasPriceBox />

      {/* Tank Status + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TankStatusPanel />
        </div>
        <div>
          <GasExceptionsAlerts />
        </div>
      </div>
    </div>
  );
};
