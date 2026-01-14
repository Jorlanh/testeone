import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; 
import { ShieldCheck, CheckCircle, X } from 'lucide-react';
import api from '../services/api';

// --- CORREÇÃO: Interface definida aqui ---
interface TwoFactorSetupProps {
    user: any; // Define que o componente aceita uma prop 'user'
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ user }) => {
    const [step, setStep] = useState<'IDLE' | 'SETUP' | 'CONFIRMED'>('IDLE');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 1. Inicia o Setup (Pede o segredo pro backend)
    const handleStartSetup = async () => {
        setLoading(true);
        try {
            const response = await api.post('/auth/2fa/setup');
            setQrCodeUrl(response.data.qrCodeUrl);
            setStep('SETUP');
        } catch (e) {
            alert('Erro ao iniciar configuração 2FA.');
        } finally {
            setLoading(false);
        }
    };

    // 2. Envia o código que o usuário leu no app para confirmar
    const handleConfirm = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/2fa/confirm', { code: confirmationCode });
            setStep('CONFIRMED');
        } catch (e: any) {
            setError('Código inválido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if(!window.confirm("Tem certeza que deseja desativar a proteção extra?")) return;
        try {
            await api.post('/auth/2fa/disable');
            setStep('IDLE');
            setQrCodeUrl('');
            setConfirmationCode('');
            alert("2FA Desativado.");
        } catch(e) { alert("Erro ao desativar."); }
    };

    // Se o usuário já tiver 2FA ativado (flag vinda do login/contexto), 
    // poderiamos iniciar direto na tela de CONFIRMED, mas por segurança 
    // deixamos o IDLE para ele "reconfigurar" ou "desativar".

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
            <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-3 rounded-full">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">Autenticação em Duas Etapas</h3>
                    <p className="text-slate-500 text-sm mb-4">
                        Proteja sua conta exigindo um código do Google Authenticator ao logar.
                    </p>

                    {step === 'IDLE' && (
                        <div className="flex gap-2">
                             <button 
                                onClick={handleStartSetup} 
                                disabled={loading}
                                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                            >
                                {loading ? 'Carregando...' : 'Configurar / Ativar 2FA'}
                            </button>
                            {/* Botão de desativar só aparece se soubermos que está ativo, ou o usuário pode tentar desativar cegamente */}
                            <button 
                                onClick={handleDisable}
                                className="text-red-500 text-sm font-bold px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Desativar
                            </button>
                        </div>
                    )}

                    {step === 'SETUP' && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2 animate-in fade-in">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="bg-white p-2 rounded shadow-sm">
                                    <QRCodeSVG value={qrCodeUrl} size={140} />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <p className="text-sm font-bold text-slate-700">1. Escaneie o QR Code no App</p>
                                    <p className="text-sm font-bold text-slate-700">2. Digite o código de 6 dígitos gerado:</p>
                                    
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            maxLength={6}
                                            placeholder="000000"
                                            className="w-32 p-2 border border-slate-300 rounded text-center tracking-widest font-mono focus:border-emerald-500 outline-none"
                                            value={confirmationCode}
                                            onChange={e => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
                                        />
                                        <button 
                                            onClick={handleConfirm}
                                            disabled={confirmationCode.length < 6 || loading}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {loading ? 'Validando...' : 'Ativar'}
                                        </button>
                                    </div>
                                    {error && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><X size={12}/> {error}</p>}
                                    
                                    <button onClick={() => setStep('IDLE')} className="text-xs text-slate-500 underline mt-2">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'CONFIRMED' && (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                            <CheckCircle size={20} />
                            <span>Segurança Ativada com Sucesso!</span>
                            <button onClick={() => setStep('IDLE')} className="ml-auto text-slate-500 text-xs hover:underline">Fechar</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};