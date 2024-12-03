import React, { useEffect, useState } from 'react';
import api from '@/libs/axios';
import useForm from '../form/useForm';
import { cls, num2Cur } from '@/libs/utils';

interface ModalProps {
    setCancleModalOpen?: any;
    cancleInfo?: any;
    values?: any;
}
export default function CancleModal({ setCancleModalOpen, cancleInfo, values }: ModalProps) {
    useEffect(() => {
        console.log('values', values);
        s.setValues(values);
    }, []);

    const closeModal = () => {
        setCancleModalOpen(false);
    };

    const { s, fn, attrs } = useForm({
        onSubmit: async () => {
            await fnEdit();
        },
    });
    const fnEdit = async () => {
        try {
            // const params = {
            //     ouid: cancleInfo.ouid,
            //     guid: cancleInfo.guid,
            //     total_commission: cancleInfo.total_commission,
            //     account_date: cancleInfo.account_date,
            //     cancel_price: s.values.cancel_price,
            //     cancel_reason: s.values.cancel_reason,
            //     cancel_state: s.values.cancel_state,
            //     cancel_file_name: s.values.cancel_file_name,
            //     cancel_file_url: s.values.cancel_file_url,
            //     cancel_tax: s.values.cancel_tax,
            // };
            const { data } = await api.post(`/scm/b2b/center/order/account/cancle`, s.values);

            s.setSubmitting(false);
            alert(data.msg);
        } catch (e: any) {}
    };
    return (
        <div className="fixed z-50 top-0 w-full h-full">
            <div className="w-full mt-12 mx-auto max-w-xl">
                <div className="w-full border-0 rounded-lg shadow-lg relative flex flex-col bg-white outline-none focus:outline-none z-50">
                    <div className="flex justify-between px-5 py-5 rounded-t border-b">
                        <div className="text-xl">취소처리</div>
                        <button className="text-red-500 text-sm " type="button" onClick={closeModal}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <form onSubmit={fn.handleSubmit} noValidate>
                        <div className="p-4 h-full ">
                            <div className="mb-2 text-gray-500 text-sm">
                                <span className="border-r pe-3 me-3">취소사유</span>정산대기상태의 취소는 신청 즉시 처리완료 됩니다.
                            </div>
                            <table className="form-table table table-bordered align-middle w-full border-t-2 border-black">
                                <tbody className="border-t border-black">
                                    <tr className="border-b">
                                        <th scope="row" className="!w-[25%]">
                                            정산예정금액
                                        </th>
                                        <td className="" colSpan={3}>
                                            {num2Cur(cancleInfo.total_commission)}
                                        </td>
                                    </tr>

                                    <tr className="border-b">
                                        <th scope="row" className="table_must">
                                            취소금액
                                        </th>
                                        <td className="" colSpan={3}>
                                            <input
                                                type="tel"
                                                name="cancel_price"
                                                value={s.values?.cancel_price || ''}
                                                onChange={fn.handleChange}
                                                className={cls(s.errors['cancel_price'] ? 'border-danger' : '', 'form-control')}
                                                {...attrs.is_mand}
                                                {...attrs.is_number}
                                                placeholder="취소 할 금액을 입력해주세요(숫자만입력)"
                                            />
                                            <div className="text-sm text-gray-500">정산예정금액 보다 작은 취소금액 입력시 부분취소 됩니다.</div>
                                            {s.errors['cancel_price'] && <div className="form-error text-red-500 text-sm !mt-2">{s.errors['cancel_price']}</div>}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <th scope="row" className="table_must">
                                            취소사유
                                        </th>
                                        <td className="" colSpan={3}>
                                            <textarea
                                                type="text"
                                                name="cancel_reason"
                                                value={s.values?.cancel_reason || ''}
                                                onChange={fn.handleChange}
                                                className={cls(s.errors['cancel_reason'] ? 'border-danger' : '', 'form-control')}
                                                {...attrs.is_mand}
                                                maxLength={50}
                                            />
                                            <div className="text-sm text-gray-500">간단하게 취소하는 사유를 입력하세요 (50자 내외)</div>
                                            {s.errors['cancel_reason'] && <div className="form-error text-red-500 text-sm !mt-2">{s.errors['cancel_reason']}</div>}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="mt-5 w-full text-center mb-5">
                                <button className="px-5 bg-blue-500 rounded-md py-2 text-white text-center" disabled={s.submitting}>
                                    저장
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black" onClick={closeModal}></div>
        </div>
    );
}
