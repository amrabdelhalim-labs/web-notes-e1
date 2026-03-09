'use client';

/**
 * PwaActivationDialog
 *
 * A multi-phase dialog that guides the user through enabling offline mode:
 *
 *   info      → explains what will be enabled (manifest, SW, IndexedDB)
 *   activating → animated stepper showing each activation step
 *   done       → success alert + "Done" button
 *   error      → error alert + "Retry" button
 *
 * The dialog cannot be closed while activation is in progress.
 */

import { useState, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorageIcon from '@mui/icons-material/Storage';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import ErrorIcon from '@mui/icons-material/Error';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useTranslations } from 'next-intl';
import { usePwaActivation } from '@/app/context/PwaActivationContext';

type DialogPhase = 'info' | 'activating' | 'done' | 'error';
type StepStatus = 'pending' | 'active' | 'done' | 'error';

interface PwaActivationDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Icon rendered inside each step node based on its current status. */
function StepStatusIcon({ status }: { status: StepStatus }) {
  if (status === 'active') return <CircularProgress size={20} sx={{ mx: 0.25 }} />;
  if (status === 'done') return <CheckCircleIcon color="success" fontSize="small" />;
  if (status === 'error') return <ErrorIcon color="error" fontSize="small" />;
  return null;
}

export default function PwaActivationDialog({ open, onClose }: PwaActivationDialogProps) {
  const t = useTranslations('PwaActivation');
  const { activate } = usePwaActivation();

  const [phase, setPhase] = useState<DialogPhase>('info');
  const [activeStep, setActiveStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(['pending', 'pending', 'pending']);

  const resetState = () => {
    setPhase('info');
    setActiveStep(0);
    setErrorMessage(null);
    setStepStatuses(['pending', 'pending', 'pending']);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleActivate = useCallback(async () => {
    setPhase('activating');
    try {
      // Step 0: Manifest injection (brief visual confirmation)
      setActiveStep(0);
      setStepStatuses(['active', 'pending', 'pending']);
      await new Promise<void>((r) => setTimeout(r, 400));

      // Step 1: Service Worker registration (real async work)
      setActiveStep(1);
      setStepStatuses(['done', 'active', 'pending']);
      await activate();

      // Step 2: Local database preparation (brief visual confirmation)
      setActiveStep(2);
      setStepStatuses(['done', 'done', 'active']);
      await new Promise<void>((r) => setTimeout(r, 300));

      setStepStatuses(['done', 'done', 'done']);
      setPhase('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('errorBody');
      setErrorMessage(msg);
      setStepStatuses((prev) => prev.map((s) => (s === 'active' ? 'error' : s)));
      setPhase('error');
    }
  }, [activate, t]);

  const stepLabels = [t('stepManifest'), t('stepSW'), t('stepDB')];

  return (
    <Dialog
      open={open}
      onClose={phase === 'activating' ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="pwa-activation-dialog-title"
    >
      <DialogTitle id="pwa-activation-dialog-title">{t('dialogTitle')}</DialogTitle>

      <DialogContent>
        {/* ── Info phase: explain what will happen ── */}
        {phase === 'info' && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('dialogSubtitle')}
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <InstallMobileIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={t('featureManifest')} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CloudSyncIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={t('featureSW')} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <StorageIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={t('featureDB')} />
              </ListItem>
            </List>
          </>
        )}

        {/* ── Progress stepper (activating / done / error) ── */}
        {phase !== 'info' && (
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 1 }}>
            {stepLabels.map((label, index) => (
              <Step
                key={label}
                active={stepStatuses[index] === 'active'}
                completed={stepStatuses[index] === 'done'}
              >
                <StepLabel
                  StepIconComponent={
                    stepStatuses[index] !== 'pending'
                      ? () => <StepStatusIcon status={stepStatuses[index]} />
                      : undefined
                  }
                  error={stepStatuses[index] === 'error'}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* ── Success alert ── */}
        {phase === 'done' && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              <Typography variant="body2" fontWeight={600} gutterBottom>
                {t('successTitle')}
              </Typography>
              <Typography variant="body2">{t('successBody')}</Typography>
            </Alert>
          </Box>
        )}

        {/* ── Error alert ── */}
        {phase === 'error' && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">
              <Typography variant="body2" fontWeight={600} gutterBottom>
                {t('errorTitle')}
              </Typography>
              <Typography variant="body2">{errorMessage ?? t('errorBody')}</Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {phase === 'info' && (
          <>
            <Button onClick={handleClose}>{t('cancelButton')}</Button>
            <Button onClick={handleActivate} variant="contained">
              {t('confirmButton')}
            </Button>
          </>
        )}
        {phase === 'activating' && (
          <Button disabled startIcon={<CircularProgress size={16} />}>
            {t('activating')}
          </Button>
        )}
        {phase === 'done' && (
          <Button onClick={handleClose} variant="contained">
            {t('doneButton')}
          </Button>
        )}
        {phase === 'error' && (
          <>
            <Button onClick={handleClose}>{t('cancelButton')}</Button>
            <Button onClick={handleActivate} variant="contained" color="error">
              {t('retryButton')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
