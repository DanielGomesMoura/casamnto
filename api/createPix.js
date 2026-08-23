export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { valor, titulo, presenteId, nomeConvidado } = req.body;
  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

  if (!ASAAS_API_KEY) {
    return res.status(500).json({ error: 'API Key do Asaas não configurada.' });
  }

  try {
    // 1. Verificar se existe um Customer Genérico, senão cria um.
    let customerId = process.env.ASAAS_CUSTOMER_ID;
    
    if (!customerId) {
      const customerRes = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify({
          name: nomeConvidado || "Convidado do Casamento",
          cpfCnpj: "69671134297", // O Asaas exige um CPF para criar o cliente
          notificationDisabled: true
        })
      });
      const customerData = await customerRes.json();
      if (!customerData.id) {
        throw new Error('Falha ao criar cliente no Asaas: ' + JSON.stringify(customerData));
      }
      customerId = customerData.id;
    }

    // 2. Criar a cobrança PIX
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    const paymentRes = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: Number(valor),
          dueDate: amanha.toISOString().split('T')[0],
          description: `Presente: ${titulo}`,
          externalReference: presenteId, // Salvamos o ID do presente para identificar depois
        })
      });

    const paymentData = await paymentRes.json();
    if (!paymentData.id) {
      throw new Error('Falha ao criar cobrança: ' + JSON.stringify(paymentData));
    }

    // 3. Obter o QR Code e o Copia e Cola do PIX
    const qrCodeRes = await fetch(`${process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'}/payments/${paymentData.id}/pixQrCode`, {
      method: 'GET',
      headers: {
        'access_token': ASAAS_API_KEY
      }
    });

    const qrCodeData = await qrCodeRes.json();

    if (!qrCodeData.payload) {
      throw new Error('Falha ao obter QR Code: ' + JSON.stringify(qrCodeData));
    }

    // 4. Retornar para o frontend
    return res.status(200).json({
      paymentId: paymentData.id,
      qrCodeImage: qrCodeData.encodedImage, // Imagem Base64
      pixPayload: qrCodeData.payload,       // Pix Copia e Cola
      expirationDate: qrCodeData.expirationDate
    });

  } catch (error) {
    console.error('Erro Asaas:', error);
    return res.status(500).json({ error: error.message });
  }
}
