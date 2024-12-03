import { NextPage } from 'next';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import useForm from '@/components/form/useForm';
import { cls } from '@/libs/utils';
import { api, setContext } from '@/libs/axios';
import CountDown from './countDown';

interface Props {
    values?: any;
    certification: any;
    onBack: any;
}

export default function AuthVaild({ values, certification, onBack }: Props) {
    const router = useRouter();
    let { redirect } = router.query;
    const [partnerModalOpen, setPartnerModalOpen] = useState(false);
    const [partnerList, setPartnerList] = useState<any>();

    const { s, fn, attrs } = useForm({
        initialValues: {
            login_id: values.login_id,
            email: values.email,
            mobile: values.mobile,
            auth_num: '',
        },
        onSubmit: async () => {
            await fn_auth_num_confirm();
        },
    });

    const fn_auth_num_confirm = async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/scm/dream/build/auth/vaild`, {
            method: 'POST',
            body: JSON.stringify({
                uid: certification.uid,
                counsel_uid: router.query.uid,
                auth_num: s.values.auth_num,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const res = await response.json();
        s.setSubmitting(false);

        if (res.code != 200) {
            alert(res.msg);
            if (res.code == 500) {
                onBack();
            }
            return;
        }

        // else {
        //     if (res.partner_list.length > 0) {
        //         setPartnerModalOpen(true);
        //         setPartnerList(res.partner_list);
        //         return;
        //     }
        // }

        router.replace('/dream/build?uid=' + res.build_uid + '&auth_num=' + encodeURIComponent(res.auth_num));
    };

    const setLocalStorage = (data: any) => {
        localStorage.setItem('partner', JSON.stringify(data.partner_info));
    };

    return (
        <>
            <form onSubmit={fn.handleSubmit} noValidate className="flex flex-col mt-4 space-y-4">
                <div className="md:w-1/2 mx-auto">
                    <div className="relative">
                        <input
                            id="auth_num"
                            name="auth_num"
                            onChange={fn.handleChange}
                            value={s.values.auth_num || ''}
                            type="text"
                            {...attrs.is_certification}
                            {...attrs.is_mand}
                            className={cls('form-control')}
                            placeholder="인증번호를 입력해주세요"
                        />
                        <CountDown onBack={onBack} count_minutes={5} />
                    </div>
                    {s.errors['auth_num'] && <div className="form-error text-red-500 text-sm !mt-2">{s.errors['auth_num']}</div>}
                    <button
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white mt-5 px-4 border border-transparent rounded-md shadow-sm font-medium focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:outline-none py-2"
                        disabled={s.submitting}
                    >
                        인증하기
                    </button>
                </div>
            </form>
        </>
    );
}
