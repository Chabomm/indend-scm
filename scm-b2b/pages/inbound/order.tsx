import type { GetServerSideProps, NextPage } from 'next';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import LayoutPopup from '@/components/LayoutPopup';
import { checkNumeric, cls, num2Cur } from '@/libs/utils';
import useForm from '@/components/form/useForm';
import Datepicker from 'react-tailwindcss-datepicker';
import { inbound, setContext } from '@/libs/inbound';
import api from '@/libs/axios';

import {
    EditForm,
    EditFormTable,
    EditFormTH,
    EditFormTD,
    EditFormSubmit,
    EditFormInput,
    EditFormLabel,
    EditFormCard,
    EditFormCardHead,
    EditFormCardBody,
    FixedButtonWrap,
    FixedButton,
} from '@/components/UIcomponent/form/EditFormA';
import EditFormCallout from '@/components/UIcomponent/form/EditFormCallout';

const B2BOrderDetail: NextPage = (props: any) => {
    const crumbs = ['서비스 신청하기'];
    const callout = [];
    const title_sub = '';
    const router = useRouter();
    const [posts, setPosts] = useState<any>({});

    useEffect(() => {
        if (props) {
            setPosts(props.response);
            s.setValues(props.response.values);
        }
    }, [router.asPath]);

    const { s, fn, attrs } = useForm({
        initialValues: {
            add_option_single: {
                startDate: null,
                endDate: null,
            },
            add_option_range: {
                startDate: null,
                endDate: null,
            },
        },
        onSubmit: async () => {
            await fnAccept();
        },
    });

    const fnAccept = async () => {
        try {
            if (s.values?.token_name != 'DREAM-MANAGER' && s.values?.token_name != 'SCM-SELLER') {
                return alert('여기까지만 테스트 가능합니다.');
            }

            let is_vaild = true;
            let is_vaild_message = '';
            s.values?.option_list.forEach(v => {
                if (v.option_yn === 'Y') {
                    if (v.apply_value === '') {
                        if (v.option_type == 'C' || v.option_type == 'D' || v.option_type == 'F') {
                            is_vaild_message = v.option_title + '을(를) 선택하세요.';
                            is_vaild = false;
                        } else {
                            is_vaild_message = v.option_title + '을(를) 입력하세요.';
                            is_vaild = false;
                        }
                    }
                }
            });

            if (!is_vaild) {
                alert(is_vaild_message);
                return;
            }

            const { data } = await inbound.post(`/scm/b2b/front/order/create`, s.values);
            s.setSubmitting(false);
            if (data.code == 200) {
                alert(data.msg);
                router.back();
            } else {
                alert(data.msg);
            }
            return;
        } catch (e: any) {
            alert('예기치 못한 오류가 발생하였습니다.\n문제 지속시 고객센터(1668-1317)로 문의 바랍니다.\n평일 10:00~18:00(점심 11:30~12:30)\n주말/공휴일 휴무');
        }
    };

    const imgFileUpload = useRef<any>();
    const allFileUpload = useRef<any>();
    const fileUploadBtn = (placeholder: string) => {
        if (placeholder == 'imageFile') {
            imgFileUpload.current.click();
        } else {
            allFileUpload.current.click();
        }
    };

    const handleChangeOrderInfo = (e: any, i?: number) => {
        let value: any, index: any;

        if (typeof i === 'undefined') {
            value = e.target.value;
            index = e.target.dataset.index || -1;
        } else {
            // 날짜
            index = i;
            value = e;
        }

        const copy = { ...s.values };
        copy.option_list[index]['apply_value'] = value;

        s.setValues(copy);
    };

    const handleChangeOrderInfoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number, options: any) => {
        if (typeof options.start !== 'undefined') {
            options.start();
        }
        try {
            let files: any = e.target.files;
            let copy = { ...s.values };
            for (var i = 0; i < files.length; i++) {
                var file = files[i];

                // 1. 확장자 체크
                var ext = file.name.split('.').pop().toLowerCase();

                if (options.file_type === undefined || options.file_type == '' || options.file_type == 'img') {
                    if (['jpeg', 'jpg', 'svg', 'png', 'gif'].indexOf(ext) == -1) {
                        alert(ext + '파일은 업로드 하실 수 없습니다.');
                        continue;
                    }
                } else if (options.file_type == 'all') {
                    if (['jpeg', 'jpg', 'svg', 'png', 'gif', 'pdf', 'csv', 'zip', 'xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt', 'hwp'].indexOf(ext) == -1) {
                        alert(ext + '파일은 업로드 하실 수 없습니다.');
                        continue;
                    }
                }

                const formData = new FormData();
                formData.append('file_object', file);
                formData.append('upload_path', options.upload_path);
                const { data } = await api.post(`/scm/aws/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

                if (i == 0) {
                    if (copy.option_list[index].ouid == -1) {
                        copy.option_list[index].ouid = 0;
                    }
                    copy.option_list[index].apply_value = data.s3_url;
                    copy.option_list[index].file_name = data.fake_name;
                } else {
                    copy.option_list[index].push({
                        apply_value: data.s3_url,
                        fake_name: data.fake_name,
                    });
                }
            }

            // 초기값 제거
            // let temp_files: any = [];
            // for (var i = 0; i < copy.option_list.length; i++) {
            //     if (copy.option_list[i].ouid != -1) {
            //         temp_files.push(copy.option_list[i]);
            //     }
            // }
            // copy.option_list = temp_files;

            s.setValues(copy);
            e.target.value = '';
        } catch (e) {
            if (typeof options.start !== 'undefined') {
                options.end();
            }
        }

        if (typeof options.start !== 'undefined') {
            options.end();
        }
    };

    const [loading, setLoading] = useState<boolean>(false);
    const fnStartUploading = () => {
        setLoading(true);
    };

    const fnEndUploading = () => {
        setLoading(false);
    };

    return (
        <LayoutPopup title={crumbs[crumbs.length - 1]} className="px-6">
            <EditFormCallout title={crumbs[crumbs.length - 1]} title_sub={title_sub} callout={callout} />
            {loading && (
                <div className="fixed w-full h-screen bg-opacity-25 bg-white z-10 flex items-center justify-center">
                    <div className="text-lg bg-white px-5 py-3 border rounded">
                        <i className="fas fa-spinner me-2"></i>파일 업로드 중 ...
                    </div>
                </div>
            )}

            <EditForm onSubmit={fn.handleSubmit}>
                <EditFormCard>
                    <EditFormCardHead>
                        <div className="text-lg">신청 서비스 정보</div>
                    </EditFormCardHead>
                    <EditFormCardBody>
                        <EditFormTable className="grid-cols-6">
                            <EditFormTH className="col-span-1">서비스명</EditFormTH>
                            <EditFormTD className="col-span-5">
                                <EditFormLabel className="">{posts?.title}</EditFormLabel>
                            </EditFormTD>
                            <EditFormTH className="col-span-1">카테고리</EditFormTH>
                            <EditFormTD className="col-span-5">
                                <EditFormLabel className="">{posts?.category}</EditFormLabel>
                            </EditFormTD>
                        </EditFormTable>
                    </EditFormCardBody>
                </EditFormCard>

                <EditFormCard>
                    <EditFormCardHead>
                        <div className="text-lg">신청 기업 정보</div>
                    </EditFormCardHead>
                    <EditFormCardBody>
                        <EditFormTable className="grid-cols-6">
                            <EditFormTH className="col-span-1">회사명</EditFormTH>
                            <EditFormTD className="col-span-5">
                                <EditFormLabel className="">{posts.apply_company}</EditFormLabel>
                            </EditFormTD>
                            <EditFormTH className="col-span-1 mand">담당자명</EditFormTH>
                            <EditFormTD className="col-span-5">
                                <EditFormInput
                                    type="text"
                                    name="apply_name"
                                    value={s.values?.apply_name || ''}
                                    is_mand={true}
                                    onChange={fn.handleChange}
                                    errors={s.errors}
                                    className=""
                                />
                            </EditFormTD>
                            <EditFormTH className="col-span-1">부서</EditFormTH>
                            <EditFormTD className="col-span-2">
                                <EditFormInput type="text" name="apply_depart" value={s.values?.apply_depart || ''} onChange={fn.handleChange} errors={s.errors} className="" />
                            </EditFormTD>
                            <EditFormTH className="col-span-1">직책</EditFormTH>
                            <EditFormTD className="col-span-2">
                                <EditFormInput type="text" name="apply_position" value={s.values?.apply_position || ''} onChange={fn.handleChange} errors={s.errors} className="" />
                            </EditFormTD>
                            <EditFormTH className="col-span-1 mand">연락처</EditFormTH>
                            <EditFormTD className="col-span-2">
                                <EditFormInput
                                    type="text"
                                    name="apply_phone"
                                    value={s.values?.apply_phone || ''}
                                    is_mand={true}
                                    is_mobile={true}
                                    onChange={fn.handleChange}
                                    errors={s.errors}
                                    className=""
                                />
                            </EditFormTD>
                            <EditFormTH className="col-span-1 mand">이메일</EditFormTH>
                            <EditFormTD className="col-span-2">
                                <EditFormInput
                                    type="text"
                                    name="apply_email"
                                    value={s.values?.apply_email || ''}
                                    is_mand={true}
                                    is_email={true}
                                    onChange={fn.handleChange}
                                    errors={s.errors}
                                    className=""
                                />
                            </EditFormTD>
                        </EditFormTable>
                    </EditFormCardBody>
                </EditFormCard>

                {s.values?.option_list?.length > 0 && (
                    <EditFormCard>
                        <EditFormCardHead>
                            <div className="text-lg">신청정보 작성</div>
                        </EditFormCardHead>
                        <EditFormCardBody>
                            <table className="form-table table table-bordered align-middle w-full border-t-2 border-black">
                                <tbody className="border-t border-black">
                                    {s.values?.option_list?.map((v: any, i: number) => (
                                        <tr key={i} className="border-b">
                                            <th scope="row" className={cls(`${v.option_yn == 'Y' && 'table_must'} !w-[20%] text-sm font-semibold`)}>
                                                {v.option_title}
                                            </th>
                                            <td className="" colSpan={3}>
                                                {v.option_type == 'A' ? (
                                                    <div className="w-full text-start">
                                                        <input
                                                            type="text"
                                                            name="apply_value"
                                                            value={v.apply_value}
                                                            data-index={i}
                                                            placeholder={v.placeholder}
                                                            onChange={handleChangeOrderInfo}
                                                            className="form-control"
                                                        />
                                                    </div>
                                                ) : v.option_type == 'B' ? (
                                                    <div className="w-full text-start">
                                                        <textarea
                                                            className="form-control"
                                                            name="apply_value"
                                                            value={v.apply_value}
                                                            onChange={handleChangeOrderInfo}
                                                            data-index={i}
                                                            placeholder={v.placeholder}
                                                        ></textarea>
                                                    </div>
                                                ) : v.option_type == 'C' ? (
                                                    <select name="apply_value" onChange={handleChangeOrderInfo} data-index={i} className="form-select">
                                                        <option value={''}>선택하세요.</option>
                                                        {v.placeholder
                                                            .split(',')
                                                            .filter(v => v != '')
                                                            ?.map((vv, ii) => (
                                                                <option key={ii} value={vv}>
                                                                    {vv}
                                                                </option>
                                                            ))}
                                                    </select>
                                                ) : v.option_type == 'D' ? (
                                                    <ul className="flex w-full gap-3 flex-wrap">
                                                        {v.placeholder
                                                            .split(',')
                                                            .filter(v => v != '')
                                                            ?.map((vv: any, ii: number) => (
                                                                <li key={ii} className="">
                                                                    <input
                                                                        onChange={handleChangeOrderInfo}
                                                                        data-index={i}
                                                                        type="radio"
                                                                        id={`apply_value_${i}_${ii}`}
                                                                        name={`apply_value_${i}`}
                                                                        value={vv}
                                                                        className="hidden peer"
                                                                    />
                                                                    <label
                                                                        htmlFor={`apply_value_${i}_${ii}`}
                                                                        className="inline-flex items-center justify-between w-full py-1 px-3 text-center text-gray-600 bg-white border border-gray-500 rounded-lg cursor-pointer peer-checked:bg-gray-500 peer-checked:text-white"
                                                                    >
                                                                        <div className="w-full">{vv}</div>
                                                                    </label>
                                                                </li>
                                                            ))}
                                                    </ul>
                                                ) : v.option_type == 'E' ? (
                                                    v.placeholder == 'single' ? (
                                                        <div className="w-full">
                                                            <Datepicker
                                                                asSingle={true}
                                                                inputName="apply_value"
                                                                value={v.apply_value}
                                                                onChange={e => {
                                                                    handleChangeOrderInfo(e, i);
                                                                }}
                                                                i18n={'ko'}
                                                                containerClassName="relative w-full text-gray-700 border border-gray-300 rounded"
                                                            />
                                                        </div>
                                                    ) : (
                                                        v.placeholder == 'range' && (
                                                            <div className="w-full">
                                                                <Datepicker
                                                                    inputName="apply_value"
                                                                    value={v.apply_value}
                                                                    onChange={e => {
                                                                        handleChangeOrderInfo(e, i);
                                                                    }}
                                                                    i18n={'ko'}
                                                                    containerClassName="relative w-full text-gray-700 border border-gray-300 rounded"
                                                                />
                                                            </div>
                                                        )
                                                    )
                                                ) : v.option_type == 'F' ? (
                                                    <>
                                                        <div className="flex align-center w-full">
                                                            <button type="button" className="btn-filter me-3" onClick={() => fileUploadBtn(v.placeholder)}>
                                                                <i className="far fa-file"></i> 파일업로드
                                                                <input
                                                                    type="file"
                                                                    ref={v.placeholder == 'imageFile' ? imgFileUpload : allFileUpload}
                                                                    name="apply_value"
                                                                    multiple
                                                                    onChange={e => {
                                                                        handleChangeOrderInfoFileUpload(e, i, {
                                                                            upload_path: '/b2b/goods/apply/',
                                                                            file_type: v.placeholder == 'imageFile' ? 'img' : 'file',
                                                                            start: fnStartUploading,
                                                                            end: fnEndUploading,
                                                                        });
                                                                    }}
                                                                    className="hidden"
                                                                />
                                                            </button>
                                                            <span className="text-gray-500 text-sm py-2">
                                                                {v.placeholder == 'imageFile'
                                                                    ? '업로드 지원 파일 : jpeg, jpg, svg, png, gif'
                                                                    : '업로드 지원 파일 : jpeg, jpg, svg, png, gif, pdf, csv, zip, xlsx, xls, docx, doc, pptx, ppt, hwp'}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-blue-500 mt-1 ps-1">{v.file_name}</div>
                                                    </>
                                                ) : (
                                                    v.option_type == 'G' && (
                                                        <div className="w-full text-start">
                                                            <div className="p-3 bg-gray-50 rounded break-all">{v.placeholder}</div>
                                                        </div>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </EditFormCardBody>
                    </EditFormCard>
                )}

                <EditFormCard>
                    <EditFormCardHead>
                        <div>
                            <div className="">서비스 제공을 위해 개인정보 3자 제공 동의 (필수)</div>
                            <div className="text-gray-500 text-sm">위 상품의 구매 조건을 확인하였으며, 결제 및 개인정보 제3자 제공에 모두 동의합니다.</div>
                        </div>
                    </EditFormCardHead>
                    <EditFormCardBody>
                        <div>
                            개인정보 3자 제공 동의 (필수)
                            <div>㈜인디앤드코리아 → {props.response.seller_name}</div>
                            <div>제공받는 자 : {props.response.seller_name}</div>
                            <div>제공하는 개인정보 항목 : 회사명, 성함, 연락처, 이메일, 문의 내용</div>
                            <div>제공받는 자의 개인정보 이용목적 : 참여기업 통계, 서비스 제공 안내, 서비스 신청 상담, 이벤트/광고성 정보제공</div>
                            <div>제공받는 자의 보유 및 이용기간 : 수집일로부터 6개월 이내 파기</div>
                            <div>
                                참여기업 통계, 프로모션 안내, 서비스 신청 상담, 이벤트/광고성 정보 제공을 목적으로 이용하며, 이용기간 경과 시 해당 정보를 지체없이 파기합니다.
                            </div>
                            <div>단, 관계 법령의 규정에 의해 보전할 필요가 있는 경우, 일정 기간 보관할 수 있습니다.</div>
                            <div>본 개인정보 3자 제공에 대해 동의를 거부하실 수 있으며, 거부하실 경우 서비스 신청 상담을 받으실 수 없습니다.</div>
                        </div>
                    </EditFormCardBody>
                </EditFormCard>

                <FixedButtonWrap cols={3}>
                    <FixedButton colspan={1} onclick={router.back} type={'button'}>
                        뒤로가기
                    </FixedButton>
                    <FixedButton colspan={2} submitting={s.submitting} type={'submit'}>
                        제출하기
                    </FixedButton>
                </FixedButtonWrap>
            </EditForm>
        </LayoutPopup>
    );
};

export const getServerSideProps: GetServerSideProps = async ctx => {
    setContext(ctx, '');
    var request: any = {
        guid: checkNumeric(ctx.query.guid),
    };
    var response: any = {};

    try {
        const { data } = await inbound.post(`/scm/b2b/front/order/read`, request);
        response = data;
    } catch (e: any) {
        if (typeof e.redirect !== 'undefined') {
            return { redirect: e.redirect };
        }
    }

    return {
        props: { response },
    };
};

export default B2BOrderDetail;
