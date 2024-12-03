import type { GetServerSideProps, NextPage } from 'next';
import React, { useState, useEffect, useRef } from 'react';
import { api, setContext } from '@/libs/axios';
import { useRouter } from 'next/router';
import { cls, checkNumeric } from '@/libs/utils';
import useForm from '@/components/form/useForm';
import Datepicker from 'react-tailwindcss-datepicker';
import Layout from '@/components/Layout';
import { subDays } from 'date-fns';

const CounselEdit: NextPage = (props: any) => {
    const router = useRouter();
    const [posts, setPosts] = useState(props.response);
    const { uid } = router.query;

    useEffect(() => {
        if (JSON.stringify(props) !== '{}') {
            s.setValues(props.response);
        }
    }, [props]);

    const { s, fn, attrs } = useForm({
        initialValues: {
            wish_build_at: {
                startDate: null,
                endDate: null,
            },
        },
        onSubmit: async () => {
            await editing();
        },
    });

    const editing = async () => {
        try {
            const params = { ...s.values };

            if (params.wish_build_at?.startDate == undefined || params.wish_build_at?.startDate == '') {
                alert('구축희망일을 입력해주세요');
                const el = document.querySelector("input[name='wish_build_at']");
                (el as HTMLElement)?.focus();
                return;
            }
            params.wish_build_at = params.wish_build_at.startDate;
            params.mode = 'REG';
            params.staff_count = checkNumeric(params.staff_count);

            const { data } = await api.post(`/scm/dream/counsel/edit`, params);
            if (data.code == 200) {
                alert(data.msg);
                router.reload();
            } else {
                alert(data.msg);
            }
        } catch (e: any) {}
    };

    return (
        <Layout>
            <section style={{ backgroundColor: '#f5f9fc', paddingTop: '80px' }}>
                <div className="md:w-3/4 mx-auto py-5 px-4">
                    <div className="text-center">
                        <div>
                            <div className="font-bold text-3xl mb-5">복지드림 상담 문의</div>
                            <div>
                                복지몰 도입을 고민하시나요?
                                <br /> 궁금하신 사항을 문의주시면 친절한 상담 도와드리겠습니다.
                                <br /> 보다 빠른 상담을 위해 아래 양식을 작성해주세요.
                                <br /> 기재하신 연락처로 최대한 빠르게 연락드리겠습니다
                            </div>
                        </div>

                        <div className="p-11 mb-3">
                            <div className="border-4 py-1 px-3 text-xl font-bold rounded-full bg-white inline-block border-amber-500">복지몰구축 1668-1317</div>
                        </div>

                        <div className="p-5 bg-white shadow-md rounded-lg">
                            <div className="grid gap-5 grid-cols-3 md:gap-0 md:grid-cols-6">
                                <div className="">
                                    <img alt="img" src="/images/process02-1.png" className="inline-block" />
                                    <div className="text-sm text-amber-600">구축상담</div>
                                </div>
                                <div>
                                    <img alt="img" src="/images/process02-2.png" className="inline-block" />
                                    <div className="text-sm">구축 결정</div>
                                </div>
                                <div>
                                    <img alt="img" src="/images/process02-3.png" className="inline-block" />
                                    <div className="text-sm">계약서 작성</div>
                                </div>
                                <div>
                                    <img alt="img" src="/images/process02-4.png" className="inline-block" />
                                    <div className="text-sm">개발/디자인</div>
                                </div>
                                <div>
                                    <img alt="img" src="/images/process02-5.png" className="inline-block" />
                                    <div className="text-sm">회원등록</div>
                                </div>
                                <div>
                                    <img alt="img" src="/images/process02-6.png" className="inline-block" />
                                    <div className="text-sm">오픈</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="py-11">
                        <form onSubmit={fn.handleSubmit}>
                            <div className="must py-2 text-sm text-gray-500 mb-3">해당 아이콘 표시되어 있는 항목은 필수 입력 항목입니다.</div>
                            <div className="p-6 bg-white shadow-md rounded-lg mb-5">
                                <div className="text-lg mb-4 text-slate-600">기본정보</div>
                                <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                                    <div className="col-span-1">
                                        <label className="must form-label">회사명</label>
                                        <input
                                            type="text"
                                            name="company_name"
                                            {...attrs.is_mand}
                                            value={s.values?.company_name || ''}
                                            placeholder="회사명을 입력하세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['company_name'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['company_name'] && <div className="form-error">{s.errors['company_name']}</div>}
                                    </div>
                                    <div className="col-span-1 ">
                                        <label className="form-label">회사홈페이지(URL)</label>
                                        <input
                                            type="text"
                                            name="homepage_url"
                                            value={s.values?.homepage_url || ''}
                                            placeholder="http를 포함하여 입력해 주세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['homepage_url'] ? 'border-danger' : '', 'form-control')}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">임직원수</label>
                                        <input
                                            type="text"
                                            name="staff_count"
                                            {...attrs.is_mand}
                                            value={s.values?.staff_count || ''}
                                            placeholder="숫자만 입력해 주세요"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_count'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['staff_count'] && <div className="form-error">{s.errors['staff_count']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="form-label">구축희망일</label>
                                        <Datepicker
                                            containerClassName="relative w-full text-gray-700 border border-gray-300 rounded"
                                            useRange={false}
                                            asSingle={true}
                                            minDate={subDays(new Date(), -5)}
                                            inputName="wish_build_at"
                                            i18n={'ko'}
                                            value={{
                                                startDate: s.values?.wish_build_at?.startDate || s.values?.wish_build_at,
                                                endDate: s.values?.wish_build_at?.endDate || s.values?.wish_build_at,
                                            }}
                                            onChange={fn.handleChangeDateRange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white shadow-md rounded-lg mb-5">
                                <div className="mb-4">
                                    <span className="text-lg pr-4 text-slate-600">담당자 정보</span>
                                    <span className="text-sm text-gray-500">연락처, 이메일 상담내용이 전달됩니다</span>
                                </div>
                                <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                                    <div className="col-span-1">
                                        <label className="must form-label">담당자명</label>
                                        <input
                                            type="text"
                                            name="staff_name"
                                            {...attrs.is_mand}
                                            value={s.values?.staff_name || ''}
                                            placeholder=""
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_name'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['staff_name'] && <div className="form-error">{s.errors['staff_name']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="form-label">부서</label>
                                        <input
                                            type="text"
                                            name="staff_dept"
                                            value={s.values?.staff_dept || ''}
                                            placeholder=""
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_dept'] ? 'border-danger' : '', 'form-control')}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="form-label">직급</label>
                                        <input
                                            type="text"
                                            name="staff_position"
                                            value={s.values?.staff_position || ''}
                                            placeholder=""
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_position'] ? 'border-danger' : '', 'form-control')}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="form-label">직책</label>
                                        <input
                                            type="text"
                                            name="staff_position2"
                                            value={s.values?.staff_position2 || ''}
                                            placeholder=""
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_position2'] ? 'border-danger' : '', 'form-control')}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">연락처</label>
                                        <input
                                            type="text"
                                            name="staff_mobile"
                                            {...attrs.is_mand}
                                            {...attrs.is_mobile}
                                            value={s.values?.staff_mobile || ''}
                                            placeholder="ex) 010-0000-0000"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_mobile'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['staff_mobile'] && <div className="form-error">{s.errors['staff_mobile']}</div>}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="must form-label">이메일</label>
                                        <input
                                            type="text"
                                            name="staff_email"
                                            {...attrs.is_mand}
                                            {...attrs.is_email}
                                            value={s.values?.staff_email || ''}
                                            placeholder="ex) example@indend.co.kr"
                                            onChange={fn.handleChange}
                                            className={cls(s.errors['staff_email'] ? 'border-danger' : '', 'form-control')}
                                        />
                                        {s.errors['staff_email'] && <div className="form-error">{s.errors['staff_email']}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white shadow-md rounded-lg mb-5">
                                <div className="text-lg mb-4 text-slate-600">문의내용</div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="col-span-1">
                                        <label className="must form-label">상담 문의 & 요청내용</label>
                                        <textarea
                                            name="contents"
                                            {...attrs.is_mand}
                                            rows={4}
                                            placeholder="상담 문의 및 요청내용을 입력하세요"
                                            onChange={fn.handleChange}
                                            value={s.values?.contents || ''}
                                            className={cls(s.errors['contents'] ? 'border-danger' : '', 'form-control')}
                                        ></textarea>
                                        <div className="text-xs">{s.counts?.contents ? s.counts?.contents : '0'}/1000</div>
                                        {s.errors['contents'] && <div className="form-error">{s.errors['contents']}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="py-4">
                                <button className="rounded-md w-full text-white py-2 bg-amber-500" disabled={fn.submitting}>
                                    신청하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export const getServerSideProps: GetServerSideProps = async ctx => {
    setContext(ctx);
    var request: any = {
        uid: 0,
    };
    var response: any = {};
    try {
        const { data } = await api.post(`/scm/dream/counsel/read`, request);
        response = data;
    } catch (e: any) {
        if (typeof e.redirect !== 'undefined') {
            return { redirect: e.redirect };
        }
    }
    return {
        props: { request, response },
    };
};

export default CounselEdit;
