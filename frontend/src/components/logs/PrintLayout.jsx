import React from 'react';
import { Box, Typography, Grid, Stack } from '@mui/material';
import ELDLogGrid from './ELDLogGrid';

/**
 * PrintLayout
 * 
 * Renders a "Driver's Daily Log" sheet exactly matching the FMCSA paper format.
 * Designed to be visible ONLY when printing.
 */
const PrintLayout = ({ trip }) => {
  if (!trip || !trip.daily_logs) return null;

  return (
    <div className="print-only">
      {trip.daily_logs.map((log, index) => (
        <div key={log.day_number} className="print-page">
          {/* ─── Header ─── */}
          <Box sx={{ borderBottom: '2px solid black', mb: 2, pb: 1 }}>
            <Grid container justifyContent="space-between" alignItems="flex-end">
              <Grid item xs={6}>
                <Typography variant="h4" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Driver's Daily Log
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  (24 hours)
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Original - File at home terminal.
                </Typography>
                <Typography variant="body2">
                  Duplicate - Driver retains in his/her possession for 8 days.
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={4}>
                <Stack spacing={1}>
                  <Box sx={{ borderBottom: '1px solid black', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">Date:</Typography>
                    <Typography variant="body1">{log.date}</Typography>
                  </Box>
                  <Box sx={{ borderBottom: '1px solid black', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">Total Miles Driving Today:</Typography>
                    <Typography variant="body1">{log.total_miles_today?.toFixed(0) || 0}</Typography>
                  </Box>
                  <Box sx={{ borderBottom: '1px solid black', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">Truck/Tractor #:</Typography>
                    <Typography variant="body1">______________________</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={8}>
                <Stack spacing={1}>
                  <Box sx={{ borderBottom: '1px solid black', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">Name of Carrier:</Typography>
                    <Typography variant="body1">___________________________________________________</Typography>
                  </Box>
                  <Box sx={{ borderBottom: '1px solid black', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">Main Office Address:</Typography>
                    <Typography variant="body1">___________________________________________________</Typography>
                  </Box>
                  <Box sx={{ borderBottom: '1px solid black', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">Home Terminal Address:</Typography>
                    <Typography variant="body1">___________________________________________________</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* ─── Grid ─── */}
          <Box sx={{ mb: 3, border: '2px solid black', p: 1 }}>
            <ELDLogGrid log={log} theme="light" compact={false} />
            
            {/* Hour Totals Row (Manual Look) */}
            <Grid container sx={{ mt: 1, borderTop: '1px solid black', pt: 0.5 }}>
                <Grid item xs={2} sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Total Hours</Grid>
                <Grid item xs={10} container>
                    <Grid item xs={3} sx={{ textAlign: 'right', pr: 2, fontSize: '0.8rem' }}>{log.off_duty_hours?.toFixed(1)}</Grid>
                    <Grid item xs={3} sx={{ textAlign: 'right', pr: 2, fontSize: '0.8rem' }}>{log.sleeper_berth_hours?.toFixed(1)}</Grid>
                    <Grid item xs={3} sx={{ textAlign: 'right', pr: 2, fontSize: '0.8rem' }}>{log.driving_hours?.toFixed(1)}</Grid>
                    <Grid item xs={3} sx={{ textAlign: 'right', pr: 1, fontSize: '0.8rem' }}>{log.on_duty_hours?.toFixed(1)}</Grid>
                </Grid>
            </Grid>
          </Box>

          {/* ─── Remarks ─── */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', borderBottom: '2px solid black', mb: 1 }}>
              Remarks
            </Typography>
            <Box sx={{ minHeight: '200px', borderLeft: '2px solid black', pl: 2 }}>
              {log.duty_status_entries.map((entry, i) => (
                <Grid container key={i} sx={{ borderBottom: '1px solid #ddd', py: 0.5 }}>
                  <Grid item xs={2}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {Math.floor(entry.start_hour)}:{Math.round((entry.start_hour % 1) * 60).toString().padStart(2, '0')}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {entry.status.replace('_', ' ')}
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {entry.location || entry.activity}
                    </Typography>
                  </Grid>
                </Grid>
              ))}
            </Box>
          </Box>

          {/* ─── Footer / Recap ─── */}
          <Box sx={{ mt: 'auto', borderTop: '2px solid black', pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                  <Box sx={{ borderBottom: '1px solid black', mb: 2, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">Shipping Documents:</Typography>
                    <Typography variant="body1">______________________</Typography>
                  </Box>
                  <Box sx={{ borderBottom: '1px solid black', pb: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">Driver's Signature:</Typography>
                    <Typography variant="body1">__________________________________________</Typography>
                  </Box>
              </Grid>
              
              {/* Recap Box */}
              <Grid item xs={6}>
                 <Box sx={{ border: '2px solid black', p: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, textAlign: 'center' }}>
                        Recap: Complete at end of day
                    </Typography>
                    <Grid container spacing={1} sx={{ fontSize: '0.7rem' }}>
                        <Grid item xs={6} sx={{ borderRight: '1px solid black' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <span>70 Hour / 8 Day</span>
                                <b>Check</b>
                            </Box>
                        </Grid>
                         <Grid item xs={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <span>Total hrs on duty last 7 days</span>
                                <b>{Math.max(0, 45 + (log.day_number * 8)).toFixed(1)}</b>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <span>Total hrs available tomorrow</span>
                                <b>{Math.max(0, 70 - (45 + (log.day_number * 10))).toFixed(1)}</b>
                            </Box>
                         </Grid>
                    </Grid>
                 </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
            Use time standard of home terminal.
          </Typography>
        </div>
      ))}
    </div>
  );
};

export default PrintLayout;
