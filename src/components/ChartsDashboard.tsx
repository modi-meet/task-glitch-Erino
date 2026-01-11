import { Box, Card, CardContent, Typography } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';
import { DerivedTask } from '@/types';

interface Props {
  tasks: DerivedTask[];
}

export default function ChartsDashboard({ tasks }: Props) {
  const revenueByPriority = ['High', 'Medium', 'Low'].map(p => ({
    priority: p,
    revenue: tasks.filter(t => t.priority === (p as any)).reduce((s, t) => s + t.revenue, 0),
  }));
  const revenueByStatus = ['Todo', 'In Progress', 'Done'].map(s => ({
    status: s,
    revenue: tasks.filter(t => t.status === (s as any)).reduce((s2, t) => s2 + t.revenue, 0),
  }));
  // Helper to safely get ROI as a finite number or null
  const getValidRoi = (roi: number | null | undefined): number | null => {
    if (roi == null || !Number.isFinite(roi)) return null;
    return roi;
  };

  const roiBuckets = [
    { label: '<200', count: tasks.filter(t => { const r = getValidRoi(t.roi); return r !== null && r < 200; }).length },
    { label: '200-500', count: tasks.filter(t => { const r = getValidRoi(t.roi); return r !== null && r >= 200 && r <= 500; }).length },
    { label: '>500', count: tasks.filter(t => { const r = getValidRoi(t.roi); return r !== null && r > 500; }).length },
    { label: 'N/A', count: tasks.filter(t => getValidRoi(t.roi) === null).length },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>Insights</Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr',
            },
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">Revenue by Priority</Typography>
            <BarChart
              height={240}
              xAxis={[{ scaleType: 'band', data: revenueByPriority.map(d => d.priority) }]}
              series={[{ data: revenueByPriority.map(d => d.revenue), color: '#4F6BED' }]}
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Revenue by Status</Typography>
            <PieChart
              height={240}
              series={[{
                data: revenueByStatus.map((d, i) => ({ id: i, label: d.status, value: d.revenue })),
              }]}
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">ROI Distribution</Typography>
            <BarChart
              height={240}
              xAxis={[{ scaleType: 'band', data: roiBuckets.map(b => b.label) }]}
              series={[{ data: roiBuckets.map(b => b.count), color: '#22A699' }]}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}


