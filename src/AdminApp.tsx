import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Users, CheckCircle2, Loader2, ArrowLeft, Lock, ChevronRight, Gift, Plus, Trash2, Image as ImageIcon, Edit2, MessageCircle, Copy, QrCode, X, Download } from 'lucide-react';
import { db } from '../firebase.config';
import QRCode from 'react-qr-code';
import * as htmlToImage from 'html-to-image';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

interface Convidado {
    nome: string;
    confirmado: boolean;
}

interface FamiliaData {
    id: string;
    familia: string;
    categoria: string;
    qtdPessoas: number;
    qtdConfirmados: number;
    convidados: Convidado[];
}

interface Presente {
    id: string;
    titulo: string;
    imagemUrl: string;
    valor: number;
    isExclusivo?: boolean;
}

export default function AdminApp() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [loginError, setLoginError] = useState('');

    const [activeTab, setActiveTab] = useState<'convidados' | 'presentes'>('convidados');

    // Estados para Convidados
    const [familias, setFamilias] = useState<FamiliaData[]>([]);
    const [filtroConvidados, setFiltroConvidados] = useState<'confirmados' | 'pendentes' | 'todos'>('confirmados');

    // Estados para Presentes
    const [presentes, setPresentes] = useState<Presente[]>([]);
    const [novoPresente, setNovoPresente] = useState({ titulo: '', imagemUrl: '', valor: '', isExclusivo: false });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editandoId, setEditandoId] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Estado para o Modal do QR Code / Convite
    const [qrCodeModal, setQrCodeModal] = useState({ isOpen: false, link: '', familiaNome: '', categoria: '', id: '' });
    const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
    const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
    const [coverImageBlob, setCoverImageBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Senha de acesso (pode alterar aqui se quiser)
    const ADMIN_PASSWORD = "Bed200816@";

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            fetchData();
        } else {
            setLoginError('Senha incorreta. Tente novamente.');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Convidados
            const querySnapshot = await getDocs(collection(db, 'convite'));
            const familiasData: FamiliaData[] = [];
            querySnapshot.forEach((doc) => {
                familiasData.push({ id: doc.id, ...doc.data() } as FamiliaData);
            });
            setFamilias(familiasData);

            // Fetch Presentes
            const presentesSnapshot = await getDocs(collection(db, 'presentes'));
            const presentesData: Presente[] = [];
            presentesSnapshot.forEach((doc) => {
                presentesData.push({ id: doc.id, ...doc.data() } as Presente);
            });
            setPresentes(presentesData);

        } catch (err) {
            console.error("Erro ao buscar dados:", err);
            setError('Ocorreu um erro ao carregar os dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePresente = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoPresente.titulo || !novoPresente.valor) return;

        setIsSubmitting(true);
        try {
            if (editandoId) {
                // Atualizar existente
                const docRef = doc(db, 'presentes', editandoId);
                await updateDoc(docRef, {
                    titulo: novoPresente.titulo,
                    imagemUrl: novoPresente.imagemUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2040&auto=format&fit=crop',
                    valor: parseFloat(novoPresente.valor),
                    isExclusivo: novoPresente.isExclusivo
                });

                setPresentes(presentes.map(p => p.id === editandoId ? {
                    ...p,
                    titulo: novoPresente.titulo,
                    imagemUrl: novoPresente.imagemUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2040&auto=format&fit=crop',
                    valor: parseFloat(novoPresente.valor),
                    isExclusivo: novoPresente.isExclusivo
                } : p));

                setEditandoId(null);
            } else {
                // Criar novo
                const docRef = await addDoc(collection(db, 'presentes'), {
                    titulo: novoPresente.titulo,
                    imagemUrl: novoPresente.imagemUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2040&auto=format&fit=crop',
                    valor: parseFloat(novoPresente.valor),
                    isExclusivo: novoPresente.isExclusivo
                });

                setPresentes([...presentes, {
                    id: docRef.id,
                    titulo: novoPresente.titulo,
                    imagemUrl: novoPresente.imagemUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2040&auto=format&fit=crop',
                    valor: parseFloat(novoPresente.valor),
                    isExclusivo: novoPresente.isExclusivo
                }]);
            }

            setNovoPresente({ titulo: '', imagemUrl: '', valor: '', isExclusivo: false });
        } catch (error) {
            console.error("Erro ao salvar presente:", error);
            alert("Erro ao salvar presente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (presente: Presente) => {
        setEditandoId(presente.id);
        setNovoPresente({
            titulo: presente.titulo,
            imagemUrl: presente.imagemUrl,
            valor: presente.valor.toString(),
            isExclusivo: presente.isExclusivo || false
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeletePresente = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este presente?')) return;

        try {
            await deleteDoc(doc(db, 'presentes', id));
            setPresentes(presentes.filter(p => p.id !== id));
        } catch (error) {
            console.error("Erro ao excluir presente:", error);
            alert("Erro ao excluir presente.");
        }
    };

    const copyToClipboard = (id: string) => {
        const link = window.location.origin + '/?id=' + id;
        navigator.clipboard.writeText(link);
        alert('Link copiado para a área de transferência!');
    };

    const shareOnWhatsApp = (familia: FamiliaData) => {
        const link = window.location.origin + '/?id=' + familia.id;
        const message = `Olá, família ${familia.familia}! Vocês foram convidados para o nosso casamento. Acessem o convite pelo link: ${link}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    };

    const openQrCode = (familia: FamiliaData) => {
        const link = window.location.origin + '/?id=' + familia.id;
        setQrCodeModal({ isOpen: true, link, familiaNome: familia.familia, categoria: familia.categoria, id: familia.id });
    };

    useEffect(() => {
        if (qrCodeModal.isOpen) {
            setGeneratedPdfBlob(null);
            setCoverImageBlob(null);

            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);

            if (generatedPdfUrl) URL.revokeObjectURL(generatedPdfUrl);
            setGeneratedPdfUrl(null);

            setIsGenerating(true);

            setTimeout(async () => {
                const element = document.getElementById('convite-canvas');
                if (!element) {
                    setIsGenerating(false);
                    return;
                }

                try {
                    await new Promise(r => setTimeout(r, 200));

                    // Gera a imagem principal (Capa) como PNG para o clipboard funcionar
                    const dataUrl = await htmlToImage.toPng(element, {
                        pixelRatio: 2
                    });

                    const coverBlob = await (await fetch(dataUrl)).blob();
                    setCoverImageBlob(coverBlob);
                    setPreviewUrl(URL.createObjectURL(coverBlob));

                    // Cria o PDF com tamanho "físico" de 25% (256x256) 
                    // para que abra visualmente menor, mas a qualidade interna continua 1024!
                    const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'px',
                        format: [256, 256]
                    });

                    // Configura o PDF para abrir com zoom normal (agora o tamanho físico já é menor)
                    pdf.setDisplayMode(100);

                    pdf.deletePage(1);

                    // Helper para converter imagem em Base64
                    const getBase64 = async (url: string) => {
                        const res = await fetch(url);
                        const b = await res.blob();
                        return new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(b);
                        });
                    };

                    // PÁGINA 1: Imagem 3 global
                    try {
                        const b64_3 = await getBase64('/fundo-convite-3.jpg');
                        pdf.addPage([256, 256]);
                        pdf.addImage(b64_3, 'JPEG', 0, 0, 256, 256);
                    } catch (e) {
                        console.warn("Imagem 3 não encontrada");
                    }

                    if (qrCodeModal.categoria === 'padrinho' || qrCodeModal.categoria === 'madrinha') {
                        // Se for padrinho/madrinha, adiciona as páginas específicas da pasta deles
                        try {
                            const b64_p2 = await getBase64(`/${qrCodeModal.id}/2.jpg`);
                            pdf.addPage([256, 256]);
                            pdf.addImage(b64_p2, 'JPEG', 0, 0, 256, 256);
                        } catch (e) {
                            console.warn("Imagem 2 do padrinho não encontrada");
                        }
                        try {
                            const b64_p3 = await getBase64(`/${qrCodeModal.id}/3.jpg`);
                            pdf.addPage([256, 256]);
                            pdf.addImage(b64_p3, 'JPEG', 0, 0, 256, 256);
                        } catch (e) {
                            console.warn("Imagem 3 do padrinho não encontrada");
                        }
                    } else {
                        // PÁGINA 2 Global (para convidados normais)
                        try {
                            const b64_2 = await getBase64('/fundo-convite-2.jpg');
                            pdf.addPage([256, 256]);
                            pdf.addImage(b64_2, 'JPEG', 0, 0, 256, 256);
                        } catch (e) {
                            console.warn("Imagem 2 não encontrada");
                        }
                    }

                    // ÚLTIMA PÁGINA: Capa gerada (QR Code)
                    pdf.addPage([256, 256]);
                    pdf.addImage(dataUrl, 'PNG', 0, 0, 256, 256);

                    // Cria uma área clicável (link) exatamente em cima do QR Code (e uma margem generosa ao redor)
                    // X e Y calculados com base no centro do QR Code na página 256x256
                    pdf.link(78, 106, 100, 100, { url: qrCodeModal.link });

                    const pdfBlob = pdf.output('blob');
                    setGeneratedPdfBlob(pdfBlob);
                    setGeneratedPdfUrl(URL.createObjectURL(pdfBlob));
                } catch (err) {
                    console.error('Erro ao gerar PDF do convite:', err);
                } finally {
                    setIsGenerating(false);
                }
            }, 300);
        } else {
            setGeneratedPdfBlob(null);
            setCoverImageBlob(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            if (generatedPdfUrl) URL.revokeObjectURL(generatedPdfUrl);
            setGeneratedPdfUrl(null);
        }
    }, [qrCodeModal.isOpen]);

    const copyImageToClipboard = async () => {
        if (!coverImageBlob) return;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': coverImageBlob })
            ]);
            alert('Capa copiada! Agora é só colar no WhatsApp!');
        } catch (err) {
            console.error('Erro ao copiar imagem', err);
            alert('Seu navegador não suporta copiar direto. Clique com o botão direito na imagem e selecione "Copiar imagem".');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Acesso Restrito</h2>
                    <p className="text-center text-slate-500 mb-8">Digite a senha para acessar o painel.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                placeholder="Sua senha"
                                value={passwordInput}
                                onChange={(e) => {
                                    setPasswordInput(e.target.value);
                                    setLoginError('');
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                            />
                            {loginError && (
                                <p className="text-red-500 text-sm mt-2">{loginError}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Entrar <ChevronRight className="w-5 h-5" />
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <a href="/" className="text-sm text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Voltar ao site
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Lógica do Filtro de Convidados
    const stats = {
        total: 0,
        texto: ''
    };
    let familiasFiltradas = familias;

    if (filtroConvidados === 'confirmados') {
        stats.total = familias.reduce((acc, f) => acc + f.convidados.filter(c => c.confirmado).length, 0);
        stats.texto = 'confirmados';
        familiasFiltradas = familias.filter(f => f.convidados.some(c => c.confirmado));
    } else if (filtroConvidados === 'pendentes') {
        stats.total = familias.reduce((acc, f) => acc + f.convidados.filter(c => !c.confirmado).length, 0);
        stats.texto = 'pendentes';
        familiasFiltradas = familias.filter(f => f.convidados.some(c => !c.confirmado));
    } else {
        stats.total = familias.reduce((acc, f) => acc + f.convidados.length, 0);
        stats.texto = 'convidados no total';
        familiasFiltradas = familias;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Carregando painel...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-100">
                    <p className="text-red-500 font-medium mb-4">{error}</p>
                    <button
                        onClick={() => fetchData()}
                        className="bg-primary-600 text-white px-6 py-2 rounded-full font-medium hover:bg-primary-700 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm print:hidden">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary-600" />
                            </div>
                            <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">Painel</h1>
                        </div>

                        {/* Tabs Navegação */}
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('convidados')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'convidados' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Convidados</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('presentes')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'presentes' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="flex items-center gap-2"><Gift className="w-4 h-4" /> Presentes</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {activeTab === 'convidados' && (
                            <button
                                onClick={() => window.print()}
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Imprimir
                            </button>
                        )}
                        <button
                            onClick={() => setIsAuthenticated(false)}
                            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:py-0 print:max-w-full">

                {activeTab === 'convidados' ? (
                    <>
                        {/* Cabeçalho exclusivo para impressão */}
                        <div className="hidden print:block mb-8 border-b border-slate-300 pb-4">
                            <h1 className="text-2xl font-bold text-slate-800">
                                {filtroConvidados === 'confirmados' ? 'Lista de Convidados Confirmados' :
                                    filtroConvidados === 'pendentes' ? 'Lista de Convidados Pendentes' :
                                        'Lista de Todos os Convidados'}
                            </h1>
                            <p className="text-slate-500 mt-1">Total: {stats.total} {stats.texto} | {familiasFiltradas.length} famílias</p>
                        </div>

                        {/* Botões de Filtro */}
                        <div className="flex flex-wrap gap-3 mb-8 print:hidden bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                            <button
                                onClick={() => setFiltroConvidados('confirmados')}
                                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${filtroConvidados === 'confirmados'
                                    ? 'bg-green-100 text-green-700 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Confirmados
                            </button>
                            <button
                                onClick={() => setFiltroConvidados('pendentes')}
                                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${filtroConvidados === 'pendentes'
                                    ? 'bg-yellow-100 text-yellow-700 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <Loader2 className="w-5 h-5" />
                                Pendentes
                            </button>
                            <button
                                onClick={() => setFiltroConvidados('todos')}
                                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${filtroConvidados === 'todos'
                                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                Todos
                            </button>
                        </div>

                        {/* Resumo do Filtro Selecionado */}
                        <div className="mb-6 px-2 print:hidden flex justify-between items-center text-slate-600">
                            <p>Exibindo <strong className="text-slate-800">{stats.total}</strong> {stats.texto}.</p>
                            <p className="text-sm">{familiasFiltradas.length} famílias</p>
                        </div>

                        {/* List of Guests */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 print:hidden flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-slate-800">
                                    {filtroConvidados === 'confirmados' ? 'Convidados Confirmados' :
                                        filtroConvidados === 'pendentes' ? 'Convidados Pendentes' :
                                            'Todos os Convidados'}
                                </h2>
                            </div>

                            {familiasFiltradas.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 print:text-left print:p-0">
                                    Nenhum convidado encontrado para este filtro.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 print:divide-slate-300">
                                    {familiasFiltradas.map((familia) => {
                                        const convidadosFiltrados = familia.convidados.filter(c => {
                                            if (filtroConvidados === 'todos') return true;
                                            if (filtroConvidados === 'confirmados') return c.confirmado;
                                            return !c.confirmado;
                                        });

                                        if (convidadosFiltrados.length === 0) return null;

                                        return (
                                            <div key={familia.id} className="p-6 hover:bg-slate-50/50 transition-colors print:p-0 print:py-4 print:break-inside-avoid">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-800 text-lg">{familia.familia}</h3>
                                                        <p className="text-sm text-slate-500 capitalize">{familia.categoria}</p>
                                                    </div>
                                                    <div className="flex flex-col sm:items-end gap-2">
                                                        <div className={`inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-full print:bg-transparent print:text-slate-800 print:p-0 print:font-bold ${filtroConvidados === 'confirmados' ? 'bg-green-100 text-green-700' :
                                                            filtroConvidados === 'pendentes' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {convidadosFiltrados.length} {convidadosFiltrados.length === 1 ? 'pessoa' : 'pessoas'}
                                                        </div>
                                                        <div className="flex gap-1 print:hidden">
                                                            <button
                                                                onClick={() => copyToClipboard(familia.id)}
                                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                                title="Copiar Link"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => shareOnWhatsApp(familia)}
                                                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Enviar no WhatsApp"
                                                            >
                                                                <MessageCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openQrCode(familia)}
                                                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                                title="Ver Convite (Imagem com QR Code)"
                                                            >
                                                                <QrCode className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 print:bg-transparent print:border-none print:p-0">
                                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {convidadosFiltrados.map((convidado, index) => (
                                                            <li key={index} className="flex items-center gap-2 text-slate-700">
                                                                {convidado.confirmado ? (
                                                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 print:hidden" />
                                                                ) : (
                                                                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 print:hidden" />
                                                                )}
                                                                <span className="print:list-item print:ml-4 flex-1">{convidado.nome}</span>
                                                                {!convidado.confirmado && (
                                                                    <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full print:hidden">
                                                                        Pendente
                                                                    </span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    {editandoId ? <Edit2 className="w-5 h-5 text-primary-600" /> : <Plus className="w-5 h-5 text-primary-600" />}
                                    {editandoId ? 'Editar Presente' : 'Adicionar Novo Presente'}
                                </h2>
                                {editandoId && (
                                    <button
                                        onClick={() => {
                                            setEditandoId(null);
                                            setNovoPresente({ titulo: '', imagemUrl: '', valor: '', isExclusivo: false });
                                        }}
                                        className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                                    >
                                        Cancelar Edição
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleSavePresente} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Título do Presente *</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Ex: Cota Passeio de Lancha"
                                            value={novoPresente.titulo}
                                            onChange={(e) => setNovoPresente({ ...novoPresente, titulo: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$) *</label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            placeholder="Ex: 150.00"
                                            value={novoPresente.valor}
                                            onChange={(e) => setNovoPresente({ ...novoPresente, valor: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">URL da Foto (Opcional)</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                value={novoPresente.imagemUrl}
                                                onChange={(e) => setNovoPresente({ ...novoPresente, imagemUrl: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="isExclusivo"
                                        checked={novoPresente.isExclusivo}
                                        onChange={(e) => setNovoPresente({ ...novoPresente, isExclusivo: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                                    />
                                    <label htmlFor="isExclusivo" className="text-sm font-medium text-slate-700">
                                        Presente Exclusivo (Sairá da lista quando alguém comprar)
                                    </label>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-primary-600 text-white font-medium py-2 px-6 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editandoId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                        {editandoId ? 'Atualizar Presente' : 'Salvar Presente'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-slate-800">Presentes Cadastrados</h2>
                                <span className="text-sm text-slate-500">{presentes.length} itens</span>
                            </div>

                            {presentes.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    Nenhum presente cadastrado na lista.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {presentes.map((presente) => (
                                        <div key={presente.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                            <img
                                                src={presente.imagemUrl}
                                                alt={presente.titulo}
                                                className="w-16 h-16 rounded-lg object-cover bg-slate-200 shrink-0"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-800">{presente.titulo}</h3>
                                                <p className="text-primary-600 font-medium">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(presente.valor)}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEditClick(presente)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePresente(presente.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Elemento oculto para geração em alta resolução (1080x) */}
            {qrCodeModal.isOpen && (
                <div className="fixed -left-[9999px] top-0 pointer-events-none">
                    <div
                        id="convite-canvas"
                        className="relative w-[1024px] bg-white flex flex-col items-center justify-center"
                    >
                        <img src="/fundo-convite.jpg" alt="Fundo" className="w-full h-auto block" />

                        {/* Posicionamento do QR code (Abaixado mais para alinhar com o quadrado laranja) */}
                        <div className="absolute top-[61%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-[20px] shadow-sm">
                            <QRCode
                                value={qrCodeModal.link}
                                size={170}
                                level="H"
                                fgColor="#8c1c2e" // Vermelho escuro
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrCodeModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden my-8">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-semibold text-slate-800 text-lg">Convite Personalizado</h3>
                            <button
                                onClick={() => setQrCodeModal({ isOpen: false, link: '', familiaNome: '', categoria: '', id: '' })}
                                className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-full shadow-sm hover:shadow transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col items-center bg-slate-50">
                            {isGenerating || !previewUrl ? (
                                <div className="w-full min-h-[400px] bg-slate-200 animate-pulse rounded-2xl flex items-center justify-center border border-slate-300">
                                    <div className="text-slate-400 flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#8c1c2e]" />
                                        <p className="font-medium text-slate-500">Montando o PDF do convite...</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <img
                                        src={previewUrl}
                                        alt="Capa do Convite Gerado"
                                        className="w-full rounded-2xl shadow-md border border-slate-200"
                                    />
                                    <p className="text-xs text-slate-400 mt-2 text-center">Mostrando apenas a capa do PDF</p>
                                </>
                            )}

                            <div className="w-full mt-6 space-y-3">
                                <p className="text-xs text-center text-slate-500 font-medium pb-2 border-b border-slate-200">
                                    {qrCodeModal.categoria === 'padrinho' || qrCodeModal.categoria === 'madrinha'
                                        ? "O arquivo final gerado será um documento PDF com 4 páginas (inclui anexos exclusivos)."
                                        : "O arquivo final gerado será um documento PDF com 3 páginas."}
                                </p>

                                {generatedPdfUrl ? (
                                    <button
                                        onClick={async () => {
                                            if (!generatedPdfBlob) return;

                                            const nomeSeguro = qrCodeModal.familiaNome
                                                .normalize("NFD")
                                                .replace(/[\u0300-\u036f]/g, "")
                                                .replace(/[^a-zA-Z0-9]/g, '-')
                                                .toLowerCase();
                                            const nomeArquivo = `convite-${nomeSeguro}.pdf`;

                                            // Nova API Nativa do Chrome/Mac para salvar arquivo (Força o nome correto ignorando bugs do Chrome)
                                            if ('showSaveFilePicker' in window) {
                                                try {
                                                    const handle = await (window as any).showSaveFilePicker({
                                                        suggestedName: nomeArquivo,
                                                        types: [{
                                                            description: 'Arquivo PDF',
                                                            accept: { 'application/pdf': ['.pdf'] },
                                                        }],
                                                    });
                                                    const writable = await handle.createWritable();
                                                    await writable.write(generatedPdfBlob);
                                                    await writable.close();
                                                    return; // Sucesso com a API Nativa!
                                                } catch (err: any) {
                                                    if (err.name === 'AbortError') return; // Usuário clicou em cancelar
                                                    console.error("File Picker falhou, tentando fallback", err);
                                                }
                                            }

                                            // Fallback
                                            saveAs(generatedPdfBlob, nomeArquivo);
                                        }}
                                        className="w-full bg-[#8c1c2e] text-white font-semibold py-3.5 rounded-xl hover:bg-[#731726] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" /> Baixar PDF Completo
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full bg-[#8c1c2e]/50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        <Download className="w-5 h-5" /> Preparando PDF...
                                    </button>
                                )}

                                <button
                                    onClick={copyImageToClipboard}
                                    disabled={!coverImageBlob}
                                    className="w-full bg-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl hover:bg-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Copy className="w-5 h-5" /> Copiar apenas a Capa
                                </button>

                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(qrCodeModal.link);
                                        alert('Link copiado com sucesso!');
                                    }}
                                    className="w-full bg-white text-slate-600 font-medium py-3 rounded-xl hover:bg-slate-50 border border-slate-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Copy className="w-4 h-4" /> Apenas copiar o link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
