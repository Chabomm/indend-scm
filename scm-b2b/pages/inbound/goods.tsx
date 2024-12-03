import type { GetServerSideProps, NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { checkNumeric, cls, num2Cur } from '@/libs/utils';
import { inbound, setContext } from '@/libs/inbound';
import { stringify } from 'querystring';

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
import LayoutPopup from '@/components/LayoutPopup';
import EditFormCallout from '@/components/UIcomponent/form/EditFormCallout';

const B2BGoodsDetail: NextPage = (props: any) => {
    const crumbs = ['상품상세정보'];
    const callout = [];
    const title_sub = '';
    const router = useRouter();
    const [posts, setPosts] = useState<any>({});

    useEffect(() => {
        if (props) {
            if (JSON.stringify(props.response) == '{}') {
                alert('유효하지 않은 요청입니다.');
                // window.close();
            } else if (props.response.code != '200') {
                alert(props.msg);
                // window.close();
            }
            setPosts(props.response);
        }
    }, [router.asPath]);

    const openServiceEdit = () => {
        router.push(`/inbound/order?guid=${posts.uid}`);
    };

    const [imageChange, setImageChange] = useState<any>('');
    const close = () => {
        window.close();
    };

    return (
        <>
            <LayoutPopup title={crumbs[crumbs.length - 1]} className="px-6">
                <EditFormCallout title={posts.title} title_sub={title_sub} callout={callout} />
                <EditFormCard>
                    <EditFormCardHead className="">
                        <div className="text-lg">상품 상세정보</div>
                        <div>
                            <span className="text-gray-500 me-5">콜백을 통한 상담 후 최종 신청이 이뤄집니다.</span>
                            <span>
                                <button
                                    type="button"
                                    className="btn-funcs"
                                    onClick={() => {
                                        openServiceEdit();
                                    }}
                                >
                                    서비스 신청하기
                                </button>
                            </span>
                        </div>
                    </EditFormCardHead>
                    <EditFormCardBody>
                        <div className="p-5">
                            <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-4">
                                    <img src={imageChange == '' ? posts.thumb : imageChange} />
                                    <div className="mt-3 grid grid-cols-5 gap-2 cursor-pointer">
                                        <img src={posts.thumb} onClick={() => setImageChange(posts.thumb)} />
                                        {posts.etc_images?.map((v: any, i: number) => (
                                            <img key={i} src={v.img_url} onClick={() => setImageChange(v.img_url)} />
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-8">
                                    <div className="text-sm text-gray-700">{posts.category}</div>
                                    <div className="mt-1 text-4xl font-semibold">{posts.title}</div>
                                    <div className="mt-3">
                                        <div className={cls(`${posts.str_market_price != '' && 'won'} text-gray-500 line-through`)}>{num2Cur(posts.str_market_price)}</div>
                                        <div className={cls(`${posts.str_price != '' && 'won'} text-gray-600 font-bold text-2xl`)}>{num2Cur(posts.str_price)}</div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="inline-block px-4 py-2 rounded bg-amber-500 text-white">
                                            복지드림 할인{' '}
                                            <span className={cls(`${posts.str_sale_percent != '' && 'pct'} text-xl font-bold`)}>{num2Cur(posts.str_sale_percent)}</span>
                                        </div>
                                    </div>
                                    {posts.benefit != '' && (
                                        <div className="mt-4 bg-indigo-50 p-4 rounded-lg">
                                            <div className="font-bold">[복지드림 멤버십 혜택]</div>
                                            <div className="my-4" dangerouslySetInnerHTML={{ __html: posts.benefit }}></div>
                                        </div>
                                    )}
                                    {posts.attention != '' && (
                                        <div className="mt-4 bg-indigo-50 p-4 rounded-lg">
                                            <div className="font-bold">
                                                <i className="fas fa-info-circle"></i> 신청 전! 꼭 확인해주세요!
                                            </div>
                                            <div className="my-4 " dangerouslySetInnerHTML={{ __html: posts.attention }}></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </EditFormCardBody>
                </EditFormCard>
                {posts.other_service_list?.length > 0 && (
                    <EditFormCard>
                        <EditFormCardHead className="">
                            <div className="text-lg">이 업체의 다른 상품</div>
                        </EditFormCardHead>
                        <EditFormCardBody>
                            {posts.other_service_list?.map((v: any, i: number) => (
                                <div
                                    key={i}
                                    className="border rounded-md hover:border-black hover:cursor-pointer bg-white flex flex-col"
                                    onClick={() => router.push(`/b2b/goods/detail?uid=${v.uid}`)}
                                >
                                    <div>
                                        <img src={v.thumb} className="w-full rounded-t-md" />
                                    </div>
                                    <div className="p-2 h-full">
                                        <div className="flex flex-col justify-between h-full">
                                            <div>
                                                <div className="bg-gray-500 text-white text-xs leading-none py-1 px-2 rounded-md inline-block">{v.category}</div>
                                                <div className="mt-2">{v.title}</div>
                                            </div>
                                            <div className="mt-2 text-gray-500 ">
                                                <div className={cls(`${v.str_market_price != '' && 'won'} text-gray-500 line-through text-xs`)}>{num2Cur(v.str_market_price)}</div>
                                                <div className={cls(`${v.str_price != '' && 'won'} text-gray-600 font-bold`)}>{num2Cur(v.str_price)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </EditFormCardBody>
                    </EditFormCard>
                )}
                <EditFormCard>
                    <EditFormCardHead className="">
                        <div className="text-lg">상세정보</div>
                    </EditFormCardHead>
                    <EditFormCardBody>
                        <div className="p-5" dangerouslySetInnerHTML={{ __html: posts.contents }}></div>
                    </EditFormCardBody>
                </EditFormCard>
                {posts.benefit != '' && (
                    <EditFormCard>
                        <EditFormCardHead className="">
                            <div className="text-lg">복지드림 멤버쉽 혜택</div>
                        </EditFormCardHead>
                        <EditFormCardBody>
                            <div className="p-5" dangerouslySetInnerHTML={{ __html: posts.benefit }}></div>
                        </EditFormCardBody>
                    </EditFormCard>
                )}
            </LayoutPopup>

            <FixedButtonWrap cols={3}>
                <FixedButton colspan={1} onclick={close} type={'button'}>
                    창닫기
                </FixedButton>
                <FixedButton colspan={2} onclick={openServiceEdit} type={'submit'}>
                    서비스 신청하기
                </FixedButton>
            </FixedButtonWrap>
        </>
    );
};

export const getServerSideProps: GetServerSideProps = async ctx => {
    const guid = checkNumeric(ctx.query.guid);
    let postData: any = {};
    var response = {};

    if (ctx.req?.method == 'POST') {
        postData = await new Promise((resolve, reject) => {
            // post data getting ...
            const body: any = [];
            ctx.req?.on('data', (chunk: any) => {
                body.push(chunk);
            });
            ctx.req?.on('end', () => {
                const asString = body.toString();
                const data = JSON.parse('{"' + decodeURI(asString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                resolve(data);
            });
            ctx.req?.on('error', e => {
                resolve(e);
            });
        });

        // ctx.res?.setHeader('set-cookie', `INBOUND=${postData.token}; path=/;`);
        setContext(ctx, postData.token);
    } else {
        setContext(ctx, '');
    }

    try {
        const { data } = await inbound.post(`/scm/b2b/front/goods/read`, {
            guid: guid,
            method: ctx.req?.method,
            company_name: postData?.company_name,
            depart: postData?.depart,
            position1: postData?.position1,
            mobile: postData?.mobile,
            email: postData?.email,
        });
        response = data;
    } catch (e: any) {
        console.log(e);
        if (typeof e.redirect !== 'undefined') {
            return { redirect: e.redirect };
        }
    }
    return {
        props: { response },
    };
};

export default B2BGoodsDetail;
