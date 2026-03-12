import React, { useState } from "react";
import styled from "styled-components";
import { BtnClose } from "../../../ui/buttons/BtnClose";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "../../../../store/EmpresaStore";
import { useCuentasPorCobrarStore } from "../../../../store/CuentasPorCobrarStore";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";

interface CuentaPorCobrar {
  id_cuenta: number;
  id_cliente: number;
  nombre_cliente: string;
  saldo_actual: number;
  fecha_actualizacion: string;
}

interface CreditosPanelProps {
  onClose: () => void;
}

export const CreditosPanel: React.FC<CreditosPanelProps> = ({ onClose }) => {
  const { dataempresa } = useEmpresaStore();
  const { mostrarCuentasPorCobrar, abonarCuentaPorCobrar } =
    useCuentasPorCobrarStore();
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<CuentaPorCobrar | null>(
    null
  );
  const [paymentAmount, setPaymentAmount] = useState("");

  // Fetch accounts receivable
  const { data: cuentas = [], isLoading, error } = useQuery({
    queryKey: ["mostrar cuentas por cobrar", dataempresa?.id],
    queryFn: () =>
      mostrarCuentasPorCobrar({ _id_empresa: dataempresa?.id }),
    enabled: !!dataempresa?.id,
  });

  // Mutation for payment
  const { mutate: doAbonar, isPending } = useMutation({
    mutationKey: ["abonar cuenta por cobrar"],
    mutationFn: (params: {
      _id_cuenta: number;
      _monto: number;
      _observacion: string;
    }) => abonarCuentaPorCobrar(params),
    onError: (error: Error) => {
      toast.error("Error al abonar: " + error.message);
    },
    onSuccess: () => {
      toast.success("Abono registrado correctamente");
      queryClient.invalidateQueries({
        queryKey: ["mostrar cuentas por cobrar"],
      });
      setSelectedUser(null);
      setPaymentAmount("");
    },
  });

  const handleAbonarClick = (cuenta: CuentaPorCobrar) => {
    setSelectedUser(cuenta);
    setPaymentAmount("");
  };

  const handlePaymentInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPaymentAmount(value);
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedUser || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingrese un monto válido mayor a 0");
      return;
    }
    if (amount > selectedUser.saldo_actual) {
      toast.error("El monto excede la deuda actual");
      return;
    }

    doAbonar({
      _id_cuenta: selectedUser.id_cuenta,
      _monto: amount,
      _observacion: "Abono del cliente",
    });
  };

  const handleClosePaymentModal = () => {
    setSelectedUser(null);
    setPaymentAmount("");
  };

  return (
    <ModalContainer>
      <Header>
        Cuentas por Cobrar
        <CloseWrapper>
          <BtnClose funcion={onClose} />
        </CloseWrapper>
      </Header>

      {isLoading ? (
        <LoadingContainer>
          <BarLoader color="#007bff" />
          <span>Cargando cuentas...</span>
        </LoadingContainer>
      ) : error ? (
        <ErrorContainer>
          Error al cargar las cuentas: {(error as Error).message}
        </ErrorContainer>
      ) : cuentas.length === 0 ? (
        <EmptyContainer>
          No hay cuentas por cobrar pendientes.
        </EmptyContainer>
      ) : (
        <List>
          {cuentas.map((cuenta: CuentaPorCobrar) => (
            <Item key={cuenta.id_cuenta}>
              <Info>
                <Name>{cuenta.nombre_cliente}</Name>
                <Amount>$ {cuenta.saldo_actual.toFixed(2)}</Amount>
              </Info>
              <AbonarButton onClick={() => handleAbonarClick(cuenta)}>
                abonar
              </AbonarButton>
            </Item>
          ))}
        </List>
      )}

      {selectedUser && (
        <PaymentModalOverlay onClick={handleClosePaymentModal}>
          <PaymentModal onClick={(e) => e.stopPropagation()}>
            <PaymentHeader>
              Realizar Abono
              <PaymentCloseBtn onClick={handleClosePaymentModal}>
                ×
              </PaymentCloseBtn>
            </PaymentHeader>

            <PaymentContent>
              <UserInfoSection>
                <Label>Cliente:</Label>
                <UserName>{selectedUser.nombre_cliente}</UserName>
                <Label>Deuda Actual:</Label>
                <DeudaAmount>
                  $ {selectedUser.saldo_actual.toFixed(2)}
                </DeudaAmount>
              </UserInfoSection>

              <InputSection>
                <Label>Monto a Abonar:</Label>
                <NumericInput
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={handlePaymentInputChange}
                  autoFocus
                />
              </InputSection>

              <ButtonGroup>
                <ConfirmBtn
                  onClick={handleConfirmPayment}
                  disabled={
                    !paymentAmount ||
                    parseFloat(paymentAmount) <= 0 ||
                    isPending
                  }
                >
                  {isPending ? "Procesando..." : "Abonar"}
                </ConfirmBtn>
                <CancelBtn onClick={handleClosePaymentModal}>
                  Cancelar
                </CancelBtn>
              </ButtonGroup>
            </PaymentContent>
          </PaymentModal>
        </PaymentModalOverlay>
      )}
    </ModalContainer>
  );
};

/* Styled Components */
const ModalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: ${({ theme }) => theme.bgtotal || "#fff"};
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow-y: auto;
`;

const CloseWrapper = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
`;

const Header = styled.h2`
  margin: 0;
  padding: 1.5rem;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.text};
  position: relative;
  border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: ${({ theme }) => theme.text};
`;

const ErrorContainer = styled.div`
  padding: 2rem;
  text-align: center;
  color: #f75510;
  font-weight: 600;
`;

const EmptyContainer = styled.div`
  padding: 3rem;
  text-align: center;
  color: ${({ theme }) => theme.color2};
  font-size: 1.1rem;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  overflow-y: auto;
`;

const Item = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.color2};

  &:last-child {
    border-bottom: none;
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
`;

const Name = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const Amount = styled.span`
  font-size: 1rem;
  color: ${({ theme }) => theme.color2};
  font-weight: 600;
`;

const AbonarButton = styled.button`
  background: ${({ theme }) => theme.primary || "#007bff"};
  color: #fff;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover {
    opacity: 0.9;
  }
`;

const PaymentModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const PaymentModal = styled.div`
  background-color: ${({ theme }) => theme.bgtotal || "#fff"};
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PaymentHeader = styled.h3`
  margin: 0;
  padding: 1.5rem;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.text};
  border-bottom: 1px solid ${({ theme }) => theme.color2};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PaymentCloseBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.text};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.7;
  }
`;

const PaymentContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const UserInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.color2};
`;

const Label = styled.label`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.text};
  font-weight: 600;
`;

const UserName = styled.span`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const DeudaAmount = styled.span`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.primary || "#ff6b6b"};
  font-weight: 700;
`;

const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const NumericInput = styled.input`
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 4px;
  background-color: ${({ theme }) => theme.bgsecondary || "#f5f5f5"};
  color: ${({ theme }) => theme.text};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary || "#007bff"};
    box-shadow: 0 0 0 2px
      ${({ theme }) => (theme.primary || "#007bff") + "20"};
  }

  &::placeholder {
    color: ${({ theme }) => theme.color2 + "80"};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const ConfirmBtn = styled.button`
  background: ${({ theme }) => theme.primary || "#007bff"};
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelBtn = styled.button`
  background: ${({ theme }) => theme.color2 || "#ccc"};
  color: ${({ theme }) => theme.text};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;

  &:hover {
    opacity: 0.8;
  }
`;