import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChartPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Global chart</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Today's TikTok 7-day top 1,000, with rows for tracked sounds highlighted.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming with the first cron run</CardTitle>
          <CardDescription>
            This screen renders from <code>chart_rankings</code>. Once the daily snapshot
            populates it, you'll get a country selector and a DataTable here.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--color-muted-foreground)]">
          See <code>TODO.md</code> section <strong>I</strong> for the build steps.
        </CardContent>
      </Card>
    </div>
  );
}
