import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Gamepad2,
  Plus,
  Eye,
  Edit,
  Lock,
  Calendar,
  Package,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LotteryGame {
  id: string;
  gameName: string;
  gameCode: string;
  ticketPrice: number;
  ticketsPerPack: number;
  packValue: number;
  commissionPercent: number;
  status: "Active" | "Discontinued";
  startDate: string;
  endDate: string | null;
  activePacksCount: number;
  lastDeliveryDate: string | null;
  lastSaleDate: string | null;
  hasExistingPacks: boolean;
}

const initialGames: LotteryGame[] = [
  {
    id: "1",
    gameName: "Mega Millions",
    gameCode: "MM-001",
    ticketPrice: 2.00,
    ticketsPerPack: 300,
    packValue: 600.00,
    commissionPercent: 6.0,
    status: "Active",
    startDate: "2024-01-01",
    endDate: null,
    activePacksCount: 12,
    lastDeliveryDate: "2025-01-20",
    lastSaleDate: "2025-01-25",
    hasExistingPacks: true,
  },
  {
    id: "2",
    gameName: "Powerball",
    gameCode: "PB-002",
    ticketPrice: 2.00,
    ticketsPerPack: 300,
    packValue: 600.00,
    commissionPercent: 6.0,
    status: "Active",
    startDate: "2024-01-01",
    endDate: null,
    activePacksCount: 8,
    lastDeliveryDate: "2025-01-18",
    lastSaleDate: "2025-01-25",
    hasExistingPacks: true,
  },
  {
    id: "3",
    gameName: "Lucky 7s",
    gameCode: "L7-003",
    ticketPrice: 5.00,
    ticketsPerPack: 150,
    packValue: 750.00,
    commissionPercent: 7.0,
    status: "Active",
    startDate: "2024-03-15",
    endDate: null,
    activePacksCount: 5,
    lastDeliveryDate: "2025-01-15",
    lastSaleDate: "2025-01-24",
    hasExistingPacks: true,
  },
  {
    id: "4",
    gameName: "Cash Blast",
    gameCode: "CB-004",
    ticketPrice: 10.00,
    ticketsPerPack: 100,
    packValue: 1000.00,
    commissionPercent: 8.0,
    status: "Active",
    startDate: "2024-06-01",
    endDate: null,
    activePacksCount: 3,
    lastDeliveryDate: "2025-01-10",
    lastSaleDate: "2025-01-23",
    hasExistingPacks: true,
  },
  {
    id: "5",
    gameName: "Holiday Special",
    gameCode: "HS-005",
    ticketPrice: 20.00,
    ticketsPerPack: 50,
    packValue: 1000.00,
    commissionPercent: 8.5,
    status: "Discontinued",
    startDate: "2024-11-01",
    endDate: "2025-01-15",
    activePacksCount: 1,
    lastDeliveryDate: "2024-12-20",
    lastSaleDate: "2025-01-10",
    hasExistingPacks: true,
  },
  {
    id: "6",
    gameName: "Quick Pick",
    gameCode: "QP-006",
    ticketPrice: 1.00,
    ticketsPerPack: 500,
    packValue: 500.00,
    commissionPercent: 5.0,
    status: "Active",
    startDate: "2024-02-01",
    endDate: null,
    activePacksCount: 0,
    lastDeliveryDate: null,
    lastSaleDate: null,
    hasExistingPacks: false,
  },
];

interface GameFormData {
  gameName: string;
  gameCode: string;
  ticketPrice: string;
  ticketsPerPack: string;
  commissionPercent: string;
  startDate: string;
  endDate: string;
  status: boolean;
  commissionEffectiveDate: string;
}

const emptyFormData: GameFormData = {
  gameName: "",
  gameCode: "",
  ticketPrice: "",
  ticketsPerPack: "",
  commissionPercent: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  status: true,
  commissionEffectiveDate: "",
};

export function LotteryGames() {
  const [games, setGames] = useState<LotteryGame[]>(initialGames);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingGame, setEditingGame] = useState<LotteryGame | null>(null);
  const [formData, setFormData] = useState<GameFormData>(emptyFormData);
  const [originalCommission, setOriginalCommission] = useState<number | null>(null);

  const activeGames = games.filter((g) => g.status === "Active").length;
  const discontinuedGames = games.filter((g) => g.status === "Discontinued").length;
  const totalActivePacks = games.reduce((sum, g) => sum + g.activePacksCount, 0);

  const calculatePackValue = () => {
    const price = parseFloat(formData.ticketPrice) || 0;
    const tickets = parseInt(formData.ticketsPerPack) || 0;
    return (price * tickets).toFixed(2);
  };

  const handleAddGame = () => {
    setEditingGame(null);
    setFormData(emptyFormData);
    setOriginalCommission(null);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleViewGame = (game: LotteryGame) => {
    setEditingGame(game);
    setFormData({
      gameName: game.gameName,
      gameCode: game.gameCode,
      ticketPrice: game.ticketPrice.toString(),
      ticketsPerPack: game.ticketsPerPack.toString(),
      commissionPercent: game.commissionPercent.toString(),
      startDate: game.startDate,
      endDate: game.endDate || "",
      status: game.status === "Active",
      commissionEffectiveDate: "",
    });
    setOriginalCommission(game.commissionPercent);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleEditGame = (game: LotteryGame) => {
    setEditingGame(game);
    setFormData({
      gameName: game.gameName,
      gameCode: game.gameCode,
      ticketPrice: game.ticketPrice.toString(),
      ticketsPerPack: game.ticketsPerPack.toString(),
      commissionPercent: game.commissionPercent.toString(),
      startDate: game.startDate,
      endDate: game.endDate || "",
      status: game.status === "Active",
      commissionEffectiveDate: "",
    });
    setOriginalCommission(game.commissionPercent);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleSaveGame = () => {
    // Validation
    if (!formData.gameName.trim()) {
      toast({ title: "Error", description: "Game name is required", variant: "destructive" });
      return;
    }
    if (!formData.gameCode.trim()) {
      toast({ title: "Error", description: "Game code is required", variant: "destructive" });
      return;
    }
    if (!formData.ticketPrice || parseFloat(formData.ticketPrice) <= 0) {
      toast({ title: "Error", description: "Valid ticket price is required", variant: "destructive" });
      return;
    }
    if (!formData.ticketsPerPack || parseInt(formData.ticketsPerPack) <= 0) {
      toast({ title: "Error", description: "Valid tickets per pack is required", variant: "destructive" });
      return;
    }
    if (!formData.commissionPercent || parseFloat(formData.commissionPercent) < 0) {
      toast({ title: "Error", description: "Valid commission percentage is required", variant: "destructive" });
      return;
    }

    // Check for commission change requiring effective date
    const newCommission = parseFloat(formData.commissionPercent);
    if (editingGame && originalCommission !== null && newCommission !== originalCommission) {
      if (!formData.commissionEffectiveDate) {
        toast({ 
          title: "Error", 
          description: "Commission change requires an effective date", 
          variant: "destructive" 
        });
        return;
      }
    }

    // Check for unique game code
    const codeExists = games.some(
      (g) => g.gameCode === formData.gameCode && g.id !== editingGame?.id
    );
    if (codeExists) {
      toast({ title: "Error", description: "Game code must be unique", variant: "destructive" });
      return;
    }

    const packValue = parseFloat(formData.ticketPrice) * parseInt(formData.ticketsPerPack);

    if (editingGame) {
      // Update existing game
      setGames(games.map((g) => 
        g.id === editingGame.id
          ? {
              ...g,
              gameName: formData.gameName,
              gameCode: formData.gameCode,
              // Only update price/tickets if no existing packs
              ticketPrice: g.hasExistingPacks ? g.ticketPrice : parseFloat(formData.ticketPrice),
              ticketsPerPack: g.hasExistingPacks ? g.ticketsPerPack : parseInt(formData.ticketsPerPack),
              packValue: g.hasExistingPacks ? g.packValue : packValue,
              commissionPercent: parseFloat(formData.commissionPercent),
              startDate: formData.startDate,
              endDate: formData.endDate || null,
              status: formData.status ? "Active" : "Discontinued",
            }
          : g
      ));
      toast({ title: "Success", description: "Game updated successfully" });
    } else {
      // Add new game
      const newGame: LotteryGame = {
        id: Date.now().toString(),
        gameName: formData.gameName,
        gameCode: formData.gameCode,
        ticketPrice: parseFloat(formData.ticketPrice),
        ticketsPerPack: parseInt(formData.ticketsPerPack),
        packValue: packValue,
        commissionPercent: parseFloat(formData.commissionPercent),
        status: formData.status ? "Active" : "Discontinued",
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        activePacksCount: 0,
        lastDeliveryDate: null,
        lastSaleDate: null,
        hasExistingPacks: false,
      };
      setGames([...games, newGame]);
      toast({ title: "Success", description: "Game added successfully" });
    }

    setIsDialogOpen(false);
  };

  const commissionChanged = editingGame && 
    originalCommission !== null && 
    parseFloat(formData.commissionPercent) !== originalCommission;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Games</h1>
          <p className="text-muted-foreground">Manage lottery games and configurations</p>
        </div>
        <Button onClick={handleAddGame}>
          <Plus className="h-4 w-4 mr-2" />
          Add Game
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{games.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Games</CardTitle>
            <Gamepad2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeGames}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discontinued</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{discontinuedGames}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Packs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivePacks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Games Table */}
      <Card>
        <CardHeader>
          <CardTitle>Games List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game Name</TableHead>
                <TableHead>Game Code</TableHead>
                <TableHead className="text-right">Ticket Price</TableHead>
                <TableHead className="text-right">Tickets/Pack</TableHead>
                <TableHead className="text-right">Pack Value</TableHead>
                <TableHead className="text-right">Commission %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id}>
                  <TableCell className="font-medium">{game.gameName}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      {game.gameCode}
                    </code>
                  </TableCell>
                  <TableCell className="text-right">${game.ticketPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{game.ticketsPerPack}</TableCell>
                  <TableCell className="text-right font-medium">${game.packValue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{game.commissionPercent}%</TableCell>
                  <TableCell>
                    <Badge variant={game.status === "Active" ? "default" : "secondary"}>
                      {game.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewGame(game)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGame(game)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit/View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? "View Game" : editingGame ? "Edit Game" : "Add New Game"}
            </DialogTitle>
            <DialogDescription>
              {isViewMode 
                ? "Game details and usage information"
                : editingGame 
                  ? "Update game configuration" 
                  : "Create a new lottery game"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gameName">Game Name</Label>
                <Input
                  id="gameName"
                  value={formData.gameName}
                  onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                  disabled={isViewMode}
                  placeholder="e.g., Mega Millions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gameCode">Game Code (unique)</Label>
                <Input
                  id="gameCode"
                  value={formData.gameCode}
                  onChange={(e) => setFormData({ ...formData, gameCode: e.target.value.toUpperCase() })}
                  disabled={isViewMode}
                  placeholder="e.g., MM-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticketPrice" className="flex items-center gap-2">
                  Ticket Price
                  {editingGame?.hasExistingPacks && (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.ticketPrice}
                  onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                  disabled={isViewMode || editingGame?.hasExistingPacks}
                  placeholder="0.00"
                />
                {editingGame?.hasExistingPacks && !isViewMode && (
                  <p className="text-xs text-muted-foreground">Locked - packs exist</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticketsPerPack" className="flex items-center gap-2">
                  Tickets per Pack
                  {editingGame?.hasExistingPacks && (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </Label>
                <Input
                  id="ticketsPerPack"
                  type="number"
                  min="1"
                  value={formData.ticketsPerPack}
                  onChange={(e) => setFormData({ ...formData, ticketsPerPack: e.target.value })}
                  disabled={isViewMode || editingGame?.hasExistingPacks}
                  placeholder="0"
                />
                {editingGame?.hasExistingPacks && !isViewMode && (
                  <p className="text-xs text-muted-foreground">Locked - packs exist</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Pack Value (auto)</Label>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="font-medium">{calculatePackValue()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissionPercent">Commission %</Label>
                <Input
                  id="commissionPercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.commissionPercent}
                  onChange={(e) => setFormData({ ...formData, commissionPercent: e.target.value })}
                  disabled={isViewMode}
                  placeholder="0.0"
                />
              </div>
              {commissionChanged && !isViewMode && (
                <div className="space-y-2">
                  <Label htmlFor="commissionEffectiveDate" className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    Effective Date (required)
                  </Label>
                  <Input
                    id="commissionEffectiveDate"
                    type="date"
                    value={formData.commissionEffectiveDate}
                    onChange={(e) => setFormData({ ...formData, commissionEffectiveDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label>Status</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.status 
                    ? "Game is active - new packs can be received"
                    : "Game is inactive - no new packs, existing continue until settled"
                  }
                </p>
              </div>
              <Switch
                checked={formData.status}
                onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                disabled={isViewMode}
              />
            </div>

            {/* Read-only usage info for existing games */}
            {editingGame && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Usage Information (Read-only)
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Active Packs</p>
                    <p className="font-medium">{editingGame.activePacksCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Delivery</p>
                    <p className="font-medium">{editingGame.lastDeliveryDate || "Never"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Sale</p>
                    <p className="font-medium">{editingGame.lastSaleDate || "Never"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {!isViewMode && (
              <Button onClick={handleSaveGame}>
                {editingGame ? "Update Game" : "Add Game"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
